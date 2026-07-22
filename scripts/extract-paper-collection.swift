import AppKit
import Foundation
import PDFKit

struct TextLine {
    let text: String
    let bounds: CGRect
    let pointSize: CGFloat
}

struct FigureRecord: Codable {
    let number: Int
    let page: Int
    let caption: String
    let asset: String
    let width: Int
    let height: Int
    let afterParagraph: Int
}

struct PaperRecord: Codable {
    let number: Int
    let sourcePages: [Int]
    let title: String
    let subtitle: String
    let sourceDate: String
    let paragraphs: [String]
    let figure: FigureRecord
}

struct CollectionRecord: Codable {
    let sourceFile: String
    let sourceSha256: String
    let pageCount: Int
    let papers: [PaperRecord]
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data("\(message)\n".utf8))
    exit(1)
}

func lines(on page: PDFPage) -> [TextLine] {
    guard let selection = page.selection(for: page.bounds(for: .mediaBox)) else { return [] }
    return selection.selectionsByLine().compactMap { line in
        let text = (line.string ?? "")
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return nil }
        let font = line.attributedString?.attribute(.font, at: 0, effectiveRange: nil) as? NSFont
        return TextLine(text: text, bounds: line.bounds(for: page), pointSize: font?.pointSize ?? 0)
    }
}

func joined(_ left: String, _ right: String) -> String {
    if left.hasSuffix("-") { return left + right }
    return left + " " + right
}

func isPageNumber(_ line: TextLine) -> Bool {
    line.bounds.minY < 46 && Int(line.text) != nil
}

func render(page: PDFPage, crop: CGRect, to destination: URL, scale: CGFloat = 3) throws -> (Int, Int) {
    let width = Int(ceil(crop.width * scale))
    let height = Int(ceil(crop.height * scale))
    guard let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: width,
        pixelsHigh: height,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 32
    ), let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
        throw NSError(domain: "KVersationImport", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not create image context"])
    }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    context.cgContext.setFillColor(NSColor.white.cgColor)
    context.cgContext.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.cgContext.scaleBy(x: scale, y: scale)
    context.cgContext.translateBy(x: -crop.minX, y: -crop.minY)
    page.draw(with: .mediaBox, to: context.cgContext)
    context.flushGraphics()
    NSGraphicsContext.restoreGraphicsState()

    guard let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.92]) else {
        throw NSError(domain: "KVersationImport", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not encode figure"])
    }
    try data.write(to: destination, options: .atomic)
    return (width, height)
}

let arguments = CommandLine.arguments
guard arguments.count == 4 else {
    fail("Usage: extract-paper-collection.swift SOURCE.pdf OUTPUT.json FIGURE_DIRECTORY")
}

let sourceURL = URL(fileURLWithPath: arguments[1])
let outputURL = URL(fileURLWithPath: arguments[2])
let figureDirectory = URL(fileURLWithPath: arguments[3], isDirectory: true)
guard let document = PDFDocument(url: sourceURL) else { fail("Could not open \(sourceURL.path)") }

try FileManager.default.createDirectory(at: figureDirectory, withIntermediateDirectories: true)

var startPages: [(pageIndex: Int, title: String, subtitle: String, date: String)] = []
for pageIndex in 2..<document.pageCount {
    guard let page = document.page(at: pageIndex) else { continue }
    let pageLines = lines(on: page)
    guard pageLines.count >= 5,
          pageLines[0].text == "Daniel Koo",
          pageLines[1].text == "K-VERSATION",
          abs(pageLines[3].pointSize - 16) < 0.5 else { continue }
    startPages.append((pageIndex, pageLines[3].text, pageLines[4].text, pageLines[2].text))
}

guard startPages.count == 23 else { fail("Expected 23 paper starts; found \(startPages.count)") }

var papers: [PaperRecord] = []
for paperIndex in 0..<startPages.count {
    let start = startPages[paperIndex]
    let endPageIndex = paperIndex + 1 < startPages.count ? startPages[paperIndex + 1].pageIndex - 1 : document.pageCount - 1
    var paragraphs: [String] = []
    var activeParagraph: String?
    var figureDetails: (number: Int, page: Int, caption: String, asset: String, width: Int, height: Int)?
    var figureAfterParagraph: Int?

    for pageIndex in start.pageIndex...endPageIndex {
        guard let page = document.page(at: pageIndex) else { continue }
        let pageLines = lines(on: page)

        if let captionStart = pageLines.firstIndex(where: { $0.text.hasPrefix("Figure \(paperIndex + 1).") }) {
            var captionLines: [TextLine] = [pageLines[captionStart]]
            var cursor = captionStart + 1
            while cursor < pageLines.count, abs(pageLines[cursor].pointSize - 9) < 0.5 {
                captionLines.append(pageLines[cursor])
                cursor += 1
            }
            let caption = captionLines.map(\.text).joined(separator: " ")
            let captionTop = captionLines.map { $0.bounds.maxY }.max() ?? 0
            let bodyAboveCaption = pageLines.filter { line in
                abs(line.pointSize - 12) < 0.5 && line.bounds.minY > captionTop && !isPageNumber(line)
            }
            let precedingBodyBottom = bodyAboveCaption.map { $0.bounds.minY }.min()
                ?? page.bounds(for: .mediaBox).maxY - 72
            let crop = CGRect(x: 66, y: captionTop + 9, width: 480, height: max(80, precedingBodyBottom - captionTop - 18))
            let assetName = String(format: "figure-%02d.jpg", paperIndex + 1)
            let dimensions = try render(page: page, crop: crop, to: figureDirectory.appendingPathComponent(assetName))
            figureDetails = (paperIndex + 1, pageIndex + 1, caption, assetName, dimensions.0, dimensions.1)
        }

        for line in pageLines {
            if line.text.hasPrefix("Figure \(paperIndex + 1).") {
                if let paragraph = activeParagraph {
                    paragraphs.append(paragraph)
                    activeParagraph = nil
                }
                figureAfterParagraph = paragraphs.count
                continue
            }
            guard abs(line.pointSize - 12) < 0.5 else { continue }
            if isPageNumber(line) { continue }
            if pageIndex == start.pageIndex, line.bounds.minY > 590 { continue }
            if let active = activeParagraph, line.bounds.minX < 90 {
                activeParagraph = joined(active, line.text)
            } else {
                if let active = activeParagraph { paragraphs.append(active) }
                activeParagraph = line.text
            }
        }
    }

    if let activeParagraph { paragraphs.append(activeParagraph) }
    guard let figureDetails, let figureAfterParagraph else { fail("No figure found for paper \(paperIndex + 1)") }
    let figureRecord = FigureRecord(
        number: figureDetails.number,
        page: figureDetails.page,
        caption: figureDetails.caption,
        asset: figureDetails.asset,
        width: figureDetails.width,
        height: figureDetails.height,
        afterParagraph: figureAfterParagraph
    )
    papers.append(PaperRecord(
        number: paperIndex + 1,
        sourcePages: Array((start.pageIndex + 1)...(endPageIndex + 1)),
        title: start.title,
        subtitle: start.subtitle,
        sourceDate: start.date,
        paragraphs: paragraphs,
        figure: figureRecord
    ))
}

let sha = Process()
sha.executableURL = URL(fileURLWithPath: "/usr/bin/shasum")
sha.arguments = ["-a", "256", sourceURL.path]
let pipe = Pipe()
sha.standardOutput = pipe
try sha.run()
sha.waitUntilExit()
let shaOutput = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
let sourceSha256 = shaOutput.split(separator: " ").first.map(String.init) ?? ""

let collection = CollectionRecord(
    sourceFile: sourceURL.lastPathComponent,
    sourceSha256: sourceSha256,
    pageCount: document.pageCount,
    papers: papers
)
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
try encoder.encode(collection).write(to: outputURL, options: .atomic)
print("Extracted \(papers.count) papers and \(papers.count) figures from \(document.pageCount) pages.")
