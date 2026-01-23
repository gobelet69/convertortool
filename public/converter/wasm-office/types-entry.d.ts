import { z } from 'zod';

/**
 * LibreOffice WASM Document Conversion Types
 * Headless document format conversion toolkit
 */
/**
 * Supported input document formats
 */
type InputFormat = 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'odt' | 'ods' | 'odp' | 'odg' | 'odf' | 'rtf' | 'txt' | 'html' | 'htm' | 'csv' | 'xml' | 'epub' | 'pdf';
/**
 * Supported output document formats
 */
type OutputFormat = 'pdf' | 'docx' | 'doc' | 'odt' | 'rtf' | 'txt' | 'html' | 'xlsx' | 'xls' | 'ods' | 'csv' | 'pptx' | 'ppt' | 'odp' | 'png' | 'jpg' | 'svg';
/**
 * Document conversion options
 */
interface ConversionOptions {
    /**
     * Output format for the conversion
     */
    outputFormat: OutputFormat;
    /**
     * Input format hint (auto-detected if not provided)
     */
    inputFormat?: InputFormat;
    /**
     * PDF-specific options
     */
    pdf?: PdfOptions;
    /**
     * Image output options (for png, jpg, svg)
     */
    image?: ImageOptions;
    /**
     * Password for encrypted documents
     */
    password?: string;
}
/**
 * PDF-specific conversion options
 */
interface PdfOptions {
    /**
     * PDF/A conformance level
     */
    pdfaLevel?: 'PDF/A-1b' | 'PDF/A-2b' | 'PDF/A-3b';
    /**
     * PDF quality (0-100, affects image compression)
     * @default 90
     */
    quality?: number;
}
/**
 * Image output options
 */
interface ImageOptions {
    /**
     * Image width in pixels
     */
    width?: number;
    /**
     * Image height in pixels
     */
    height?: number;
    /**
     * DPI for rendering
     * @default 150
     */
    dpi?: number;
    /**
     * Page index to export (0-based). Only exports this single page.
     * If not specified, exports the first page (page 0).
     * Cannot be used together with `pages`.
     */
    pageIndex?: number;
    /**
     * Array of page indices to export (0-based).
     * If specified, returns an array of results (one per page).
     * Cannot be used together with `pageIndex`.
     */
    pages?: number[];
}
/**
 * Result of a document conversion
 */
interface ConversionResult {
    /**
     * The converted document data
     */
    data: Uint8Array;
    /**
     * MIME type of the output
     */
    mimeType: string;
    /**
     * Suggested filename with new extension
     */
    filename: string;
    /**
     * Conversion duration in milliseconds
     */
    duration: number;
}
/**
 * WASM loader module interface
 * This is the interface for the loader.cjs module that creates the Emscripten module
 */
interface WasmLoaderModule {
    createModule: (config: Record<string, unknown>) => Promise<EmscriptenModule>;
}
/**
 * LibreOffice WASM module initialization options (Node.js)
 */
interface LibreOfficeWasmOptions {
    /**
     * Path to WASM files directory
     * @default './wasm'
     */
    wasmPath?: string;
    /**
     * Path to the worker script (for WorkerConverter)
     * When not specified, auto-detected based on module location
     */
    workerPath?: string;
    /**
     * Pre-loaded WASM loader module
     * When provided, bypasses dynamic require of loader.cjs
     * This is useful for bundlers like Turbopack that can't handle dynamic requires
     *
     * @example
     * ```typescript
     * // In your code, import the loader statically
     * import * as wasmLoader from '@matbee/libreoffice-converter/wasm/loader.cjs';
     *
     * const converter = new LibreOfficeConverter({
     *   wasmPath: './wasm',
     *   wasmLoader,
     * });
     * ```
     */
    wasmLoader?: WasmLoaderModule;
    /**
     * Enable verbose logging
     * @default false
     */
    verbose?: boolean;
    /**
     * Called when WASM module is ready
     */
    onReady?: () => void;
    /**
     * Called on initialization error
     */
    onError?: (error: Error) => void;
    /**
     * Called with progress updates during initialization
     */
    onProgress?: (progress: ProgressInfo) => void;
}
/**
 * Explicit paths to WASM files (Browser)
 * All paths are required when specified explicitly
 */
interface BrowserWasmPaths {
    /** URL to soffice.js - the main Emscripten loader script */
    sofficeJs: string;
    /** URL to soffice.wasm - the WebAssembly binary (~112MB) */
    sofficeWasm: string;
    /** URL to soffice.data - the virtual filesystem image (~80MB) */
    sofficeData: string;
    /** URL to soffice.worker.js - the Emscripten pthread worker */
    sofficeWorkerJs: string;
}
/**
 * Browser converter initialization options
 * All WASM paths are optional and default to /wasm/ via createWasmPaths()
 */
interface BrowserConverterOptions {
    /** URL to soffice.js - defaults to /wasm/soffice.js */
    sofficeJs?: string;
    /** URL to soffice.wasm - defaults to /wasm/soffice.wasm */
    sofficeWasm?: string;
    /** URL to soffice.data - defaults to /wasm/soffice.data */
    sofficeData?: string;
    /** URL to soffice.worker.js - defaults to /wasm/soffice.worker.js */
    sofficeWorkerJs?: string;
    /**
     * Enable verbose logging
     * @default false
     */
    verbose?: boolean;
    /**
     * Called when WASM module is ready
     */
    onReady?: () => void;
    /**
     * Called on initialization error
     */
    onError?: (error: Error) => void;
    /**
     * Called with progress updates during initialization
     */
    onProgress?: (progress: WasmLoadProgress) => void;
}
/**
 * Worker browser converter initialization options
 * All WASM paths are optional and default to /wasm/ via createWasmPaths()
 */
interface WorkerBrowserConverterOptions extends BrowserConverterOptions {
    /** URL to browser.worker.js - defaults to /dist/browser.worker.global.js */
    browserWorkerJs?: string;
    /**
     * Enable download progress tracking during WASM initialization
     * When enabled, intercepts fetch/XHR to track download progress for soffice.wasm and soffice.data
     *
     * **WARNING**: This is disabled by default because the fetch interceptor can break
     * WebAssembly streaming compilation in some environments. Only enable if you need
     * detailed download progress and have tested it works in your target browsers.
     *
     * @default false
     */
    enableProgressTracking?: boolean;
}
/**
 * Default URL for WASM files - relative path for same-origin hosting
 * Users typically serve WASM files from their own server at /wasm/
 */
declare const DEFAULT_WASM_BASE_URL = "/wasm/";
/**
 * Create WASM file paths from a base URL
 * Convenience helper for users who keep all WASM files in one directory
 *
 * @param baseUrl - Base URL ending with '/' (e.g., '/wasm/', 'https://cdn.example.com/wasm/')
 *                  Defaults to '/wasm/' for same-origin hosting
 * @returns Object with all WASM file paths
 *
 * @example
 * ```typescript
 * // Use default /wasm/ path (same-origin)
 * const converter = new WorkerBrowserConverter({
 *   ...createWasmPaths(),
 *   browserWorkerJs: '/dist/browser.worker.js',
 * });
 *
 * // Or use your own CDN
 * const converter = new WorkerBrowserConverter({
 *   ...createWasmPaths('https://cdn.example.com/wasm/'),
 *   browserWorkerJs: '/dist/browser.worker.js',
 * });
 * ```
 */
declare function createWasmPaths(baseUrl?: string): BrowserWasmPaths;
/**
 * Loading phases for WASM initialization
 * Used to track detailed progress during the ~80 second browser startup
 */
type WasmLoadPhase = 'download-wasm' | 'download-data' | 'compile' | 'filesystem' | 'lok-init' | 'ready' | 'starting' | 'loading' | 'initializing' | 'converting' | 'complete';
/**
 * Extended progress information with download details
 * Backward compatible - existing code using percent/message continues to work
 */
interface WasmLoadProgress {
    /** Overall progress 0-100 */
    percent: number;
    /** Human-readable status message */
    message: string;
    /** Current loading phase */
    phase: WasmLoadPhase;
    /** Bytes downloaded (present during download phases) */
    bytesLoaded?: number;
    /** Total bytes to download (present during download phases) */
    bytesTotal?: number;
}
/**
 * Progress information
 * @deprecated Use WasmLoadProgress for richer progress data
 */
interface ProgressInfo {
    phase: 'loading' | 'initializing' | 'converting' | 'complete';
    percent: number;
    message: string;
}
/**
 * Error codes for conversion failures
 */
declare enum ConversionErrorCode {
    UNKNOWN = "UNKNOWN",
    INVALID_INPUT = "INVALID_INPUT",
    UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT",
    CORRUPTED_DOCUMENT = "CORRUPTED_DOCUMENT",
    PASSWORD_REQUIRED = "PASSWORD_REQUIRED",
    WASM_NOT_INITIALIZED = "WASM_NOT_INITIALIZED",
    CONVERSION_FAILED = "CONVERSION_FAILED",
    LOAD_FAILED = "LOAD_FAILED"
}
/**
 * Custom error class for conversion errors
 */
declare class ConversionError extends Error {
    readonly code: ConversionErrorCode;
    readonly details?: string;
    constructor(code: ConversionErrorCode, message: string, details?: string);
}
/**
 * Emscripten Module interface
 */
interface EmscriptenModule {
    ccall: (name: string, returnType: string | null, argTypes: string[], args: unknown[]) => unknown;
    cwrap: (name: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown;
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    HEAPU8: Uint8Array;
    HEAP32: Int32Array;
    HEAPU32: Uint32Array;
    FS: EmscriptenFS;
    onRuntimeInitialized?: () => void;
    calledRun?: boolean;
    _lok_preinit?: (path: number, args: number) => number;
    _lok_preinit_2?: (path: number, args: number, callback: number) => number;
    _libreofficekit_hook?: (path: number) => number;
    _libreofficekit_hook_2?: (path: number, userProfile: number) => number;
    _main?: (argc: number, argv: number) => number;
    wasmTable?: WebAssembly.Table;
    locateFile?: (path: string) => string;
    print?: (text: string) => void;
    printErr?: (text: string) => void;
    ready?: Promise<EmscriptenModule>;
}
/**
 * Emscripten virtual filesystem
 */
interface EmscriptenFS {
    mkdir: (path: string) => void;
    writeFile: (path: string, data: Uint8Array | string, opts?: {
        encoding?: string;
    }) => void;
    readFile: (path: string, opts?: {
        encoding?: string;
    }) => Uint8Array | string;
    unlink: (path: string) => void;
    readdir: (path: string) => string[];
    stat: (path: string) => {
        size: number;
        isDirectory: () => boolean;
    };
    rmdir: (path: string) => void;
    rename: (oldPath: string, newPath: string) => void;
    open: (path: string, flags: unknown, mode?: unknown) => unknown;
}
/**
 * Filter name mapping for LibreOffice export
 * Note: For image exports, use getFilterForDocType() instead as filters are document-type specific
 */
declare const FORMAT_FILTERS: Record<OutputFormat, string>;
/**
 * LibreOfficeKit document types (from LibreOfficeKitEnums.h)
 */
declare enum LOKDocumentType {
    TEXT = 0,
    SPREADSHEET = 1,
    PRESENTATION = 2,
    DRAWING = 3,
    OTHER = 4
}
/**
 * MIME types for output formats
 */
declare const FORMAT_MIME_TYPES: Record<OutputFormat, string>;
/**
 * File extension to format mapping
 */
declare const EXTENSION_TO_FORMAT: Record<string, InputFormat>;
/**
 * Map LOK document type to valid output formats
 * This is based on LibreOffice's actual extension maps in desktop/source/lib/init.cxx
 *
 * IMPORTANT: These are the formats that LibreOffice's saveAs() actually supports.
 * The extension maps in init.cxx determine what filters are available per document type.
 *
 * Writer (TEXT): doc, docx, odt, pdf, rtf, txt, html, png, epub
 * Calc (SPREADSHEET): csv, ods, pdf, xls, xlsx, html, png
 * Impress (PRESENTATION): odp, pdf, ppt, pptx, svg, html, png
 * Draw (DRAWING): odg, pdf, svg, html, png
 *
 * NOTE: jpg is NOT in any extension map! Only png is supported for image export.
 * NOTE: svg is only supported for Impress and Draw, not Writer or Calc.
 */
declare const LOK_DOCTYPE_OUTPUT_FORMATS: Record<LOKDocumentType, OutputFormat[]>;
/**
 * Get valid output formats for a LOK document type
 * Use this after loading a document to get accurate conversion options
 * @param docType The LOK document type (from documentGetDocumentType)
 * @returns Array of valid output formats
 */
declare function getOutputFormatsForDocType(docType: LOKDocumentType | number): OutputFormat[];
/**
 * Document type categories for determining valid conversions
 */
type DocumentCategory = 'text' | 'spreadsheet' | 'presentation' | 'drawing' | 'other';
/**
 * Map input formats to their document category
 * This determines which output formats are valid
 */
declare const INPUT_FORMAT_CATEGORY: Record<InputFormat, DocumentCategory>;
/**
 * Valid output formats for each document category
 * Based on LibreOffice's actual filter capabilities
 */
declare const CATEGORY_OUTPUT_FORMATS: Record<DocumentCategory, OutputFormat[]>;
/**
 * Get valid output formats for a given input format
 * @param inputFormat The input document format
 * @returns Array of valid output formats
 */
declare function getValidOutputFormats(inputFormat: InputFormat | string): OutputFormat[];
/**
 * Check if a conversion from input format to output format is valid
 * @param inputFormat The input document format
 * @param outputFormat The desired output format
 * @returns true if the conversion is supported
 */
declare function isConversionValid(inputFormat: InputFormat | string, outputFormat: OutputFormat | string): boolean;
/**
 * Get a human-readable error message for invalid conversions
 * @param inputFormat The input document format
 * @param outputFormat The desired output format
 * @returns Error message explaining why the conversion is not supported
 */
declare function getConversionErrorMessage(inputFormat: InputFormat | string, outputFormat: OutputFormat | string): string;
/**
 * Page preview data returned by renderPage/renderPagePreviews
 */
interface PagePreview {
    page: number;
    data: Uint8Array;
    width: number;
    height: number;
}
/**
 * Document information returned by getDocumentInfo
 */
interface DocumentInfo {
    documentType: LOKDocumentType | number;
    documentTypeName: string;
    validOutputFormats: OutputFormat[];
    pageCount: number;
}
/**
 * Options for rendering page previews
 */
interface RenderOptions {
    /** Width of rendered image in pixels */
    width?: number;
    /** Height of rendered image in pixels (0 = auto based on aspect ratio) */
    height?: number;
    /** Specific page indices to render (0-based). If empty, renders all pages */
    pageIndices?: number[];
    /**
     * Render in edit mode (shows text input boxes, cursors, etc.)
     * Default is false - presentations render in view/read mode for clean output
     */
    editMode?: boolean;
}
/**
 * Options for full quality page rendering
 */
interface FullQualityRenderOptions {
    /** DPI for rendering (default 150, use 300 for print quality) */
    dpi?: number;
    /** Maximum dimension (width or height) to prevent memory issues */
    maxDimension?: number;
    /**
     * Render in edit mode (shows text input boxes, cursors, etc.)
     * Default is false - presentations render in view/read mode for clean output
     */
    editMode?: boolean;
}
/**
 * Full quality page preview with DPI information
 */
interface FullQualityPagePreview extends PagePreview {
    /** Effective DPI (may differ from requested if capped) */
    dpi: number;
}
/**
 * Editor session returned from openDocument
 */
interface EditorSession {
    sessionId: string;
    documentType: string;
    pageCount: number;
}
/**
 * Result from editor operations
 */
interface EditorOperationResult<T = unknown> {
    success: boolean;
    verified?: boolean;
    data?: T;
    error?: string;
    suggestion?: string;
}
/**
 * Options containing input format for document operations.
 */
type InputFormatOptions = Pick<ConversionOptions, 'inputFormat'>;
/**
 * Common interface for all LibreOffice converter implementations.
 * Ensures consistent API across different threading models (main thread, workers, child processes).
 *
 * All methods returning Promise are async in the interface to allow implementations
 * flexibility in whether they need actual async operations.
 */
interface ILibreOfficeConverter {
    /** Initialize the converter. Must be called before any other operations. */
    initialize(): Promise<void>;
    /** Destroy the converter and release all resources. */
    destroy(): Promise<void>;
    /** Check if the converter is ready for operations. */
    isReady(): boolean;
    /** Convert a document to a different format. */
    convert(input: Uint8Array | ArrayBuffer, options: ConversionOptions, filename?: string): Promise<ConversionResult>;
    /** Get the number of pages in a document. */
    getPageCount(input: Uint8Array | ArrayBuffer, options: InputFormatOptions): Promise<number>;
    /** Get document information including type and valid output formats. */
    getDocumentInfo(input: Uint8Array | ArrayBuffer, options: InputFormatOptions): Promise<DocumentInfo>;
    /** Render a single page as an image. */
    renderPage(input: Uint8Array | ArrayBuffer, options: InputFormatOptions, pageIndex: number, width: number, height?: number): Promise<PagePreview>;
    /** Render multiple pages as images. */
    renderPagePreviews(input: Uint8Array | ArrayBuffer, options: InputFormatOptions, renderOptions?: RenderOptions): Promise<PagePreview[]>;
    /**
     * Render a page at full quality (native resolution based on DPI).
     * Unlike renderPage which scales to a fixed width, this renders at the
     * document's native resolution converted to pixels at the specified DPI.
     */
    renderPageFullQuality(input: Uint8Array | ArrayBuffer, options: InputFormatOptions, pageIndex: number, renderOptions?: FullQualityRenderOptions): Promise<FullQualityPagePreview>;
    /** Open a document for editing and return a session. */
    openDocument(input: Uint8Array | ArrayBuffer, options: InputFormatOptions): Promise<EditorSession>;
    /** Execute an editor operation on an open document. */
    editorOperation<T = unknown>(sessionId: string, method: string, args?: unknown[]): Promise<EditorOperationResult<T>>;
    /** Close an editor session and optionally get the modified document. */
    closeDocument(sessionId: string): Promise<Uint8Array | undefined>;
}

/**
 * Result of any editor operation
 */
interface OperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    suggestion?: string;
    verified: boolean;
    truncated?: TruncationInfo;
}
interface TruncationInfo {
    original: number;
    returned: number;
    message: string;
}
/**
 * Options for opening a document
 */
interface OpenDocumentOptions {
    session?: boolean;
    maxResponseChars?: number;
    password?: string;
    verbose?: boolean;
}
interface TextPosition {
    paragraph: number;
    character: number;
}
interface TextRange {
    start: TextPosition;
    end: TextPosition;
}
interface TextFormat {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    fontName?: string;
    color?: string;
}
interface Paragraph {
    index: number;
    text: string;
    style: string;
    charCount: number;
}
interface WriterStructure {
    type: 'writer';
    paragraphs: Array<{
        index: number;
        preview: string;
        style: string;
        charCount: number;
    }>;
    pageCount: number;
    wordCount: number;
    metadata?: DocumentMetadata;
}
type CellRef = string | {
    row: number;
    col: number;
};
type RangeRef = string | {
    start: CellRef;
    end: CellRef;
};
type ColRef = string | number;
type SheetRef = string | number;
type CellValue = string | number | boolean | null;
interface CellData {
    address: string;
    value: CellValue;
    formula?: string;
    format?: CellFormat;
}
interface CellFormat {
    bold?: boolean;
    numberFormat?: string;
    backgroundColor?: string;
    textColor?: string;
}
interface SheetInfo {
    index: number;
    name: string;
    usedRange: string;
    rowCount: number;
    colCount: number;
}
interface CalcStructure {
    type: 'calc';
    sheets: SheetInfo[];
    metadata?: DocumentMetadata;
}
type SlideLayout = 'blank' | 'title' | 'titleContent' | 'twoColumn';
interface TextFrame {
    index: number;
    type: 'title' | 'body' | 'subtitle' | 'other';
    text: string;
    bounds: Rectangle;
}
interface SlideData {
    index: number;
    title?: string;
    textFrames: TextFrame[];
    hasNotes: boolean;
}
interface SlideInfo {
    index: number;
    title?: string;
    layout: SlideLayout;
    textFrameCount: number;
}
interface ImpressStructure {
    type: 'impress';
    slides: SlideInfo[];
    slideCount: number;
    metadata?: DocumentMetadata;
}
type ShapeType = 'text' | 'rectangle' | 'ellipse' | 'line' | 'image' | 'group' | 'other';
interface ShapeData {
    index: number;
    type: ShapeType;
    text?: string;
    bounds: Rectangle;
}
interface PageData {
    index: number;
    shapes: ShapeData[];
    size: Size;
}
interface PageInfo {
    index: number;
    shapeCount: number;
    size: Size;
}
interface DrawStructure {
    type: 'draw';
    pages: PageInfo[];
    pageCount: number;
    isImportedPdf: boolean;
    metadata?: DocumentMetadata;
}
interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface Size {
    width: number;
    height: number;
}
interface DocumentMetadata {
    title?: string;
    author?: string;
    pageCount?: number;
}
type DocumentStructure = WriterStructure | CalcStructure | ImpressStructure | DrawStructure;
type DocumentType = 'writer' | 'calc' | 'impress' | 'draw';
interface SelectionRange {
    type: 'text' | 'cell' | 'shape';
    start: TextPosition | CellRef | {
        page: number;
        shape: number;
    };
    end?: TextPosition | CellRef | {
        page: number;
        shape: number;
    };
}
interface FindOptions {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    paragraph?: number;
}
interface Position {
    x: number;
    y: number;
}

/**
 * LLM-friendly tool definitions for document editing
 *
 * This module provides a hashmap of tools with names, descriptions, and Zod schemas
 * for use with LLM function calling / tool use APIs.
 */

interface ToolDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
    name: string;
    description: string;
    parameters: T;
    documentTypes: ('writer' | 'calc' | 'impress' | 'draw' | 'all')[];
}
declare const commonTools: {
    readonly getStructure: {
        readonly name: "getStructure";
        readonly description: "Get the document structure including paragraphs, sheets, slides, or pages depending on document type. Returns an overview of the document content.";
        readonly parameters: z.ZodObject<{
            maxResponseChars: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly save: {
        readonly name: "save";
        readonly description: "Save changes to the document at its original path.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly saveAs: {
        readonly name: "saveAs";
        readonly description: "Save the document to a new path with optional format conversion.";
        readonly parameters: z.ZodObject<{
            path: z.ZodString;
            format: z.ZodEnum<{
                png: "png";
                jpg: "jpg";
                svg: "svg";
                doc: "doc";
                docx: "docx";
                xls: "xls";
                xlsx: "xlsx";
                ppt: "ppt";
                pptx: "pptx";
                odt: "odt";
                ods: "ods";
                odp: "odp";
                rtf: "rtf";
                txt: "txt";
                html: "html";
                csv: "csv";
                pdf: "pdf";
            }>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly close: {
        readonly name: "close";
        readonly description: "Close the document and release resources.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly undo: {
        readonly name: "undo";
        readonly description: "Undo the last edit operation.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly redo: {
        readonly name: "redo";
        readonly description: "Redo the previously undone operation.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly find: {
        readonly name: "find";
        readonly description: "Find text in the document. Returns match count and position of first match.";
        readonly parameters: z.ZodObject<{
            text: z.ZodString;
            caseSensitive: z.ZodOptional<z.ZodBoolean>;
            wholeWord: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly findAndReplaceAll: {
        readonly name: "findAndReplaceAll";
        readonly description: "Find all occurrences of text and replace them.";
        readonly parameters: z.ZodObject<{
            find: z.ZodString;
            replace: z.ZodString;
            caseSensitive: z.ZodOptional<z.ZodBoolean>;
            wholeWord: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly getSelection: {
        readonly name: "getSelection";
        readonly description: "Get the currently selected text or range.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly clearSelection: {
        readonly name: "clearSelection";
        readonly description: "Clear the current selection.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly enableEditMode: {
        readonly name: "enableEditMode";
        readonly description: "Enable edit mode for the document. Required before making changes.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly getEditMode: {
        readonly name: "getEditMode";
        readonly description: "Get the current edit mode (0 = view, 1 = edit).";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
};
declare const writerTools: {
    readonly getParagraph: {
        readonly name: "getParagraph";
        readonly description: "Get a single paragraph by its index. Use getStructure() first to see available paragraphs.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly getParagraphs: {
        readonly name: "getParagraphs";
        readonly description: "Get a range of paragraphs. Useful for paginating through large documents.";
        readonly parameters: z.ZodObject<{
            start: z.ZodNumber;
            count: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly insertParagraph: {
        readonly name: "insertParagraph";
        readonly description: "Insert a new paragraph with optional styling.";
        readonly parameters: z.ZodObject<{
            text: z.ZodString;
            afterIndex: z.ZodOptional<z.ZodNumber>;
            style: z.ZodOptional<z.ZodEnum<{
                Normal: "Normal";
                "Heading 1": "Heading 1";
                "Heading 2": "Heading 2";
                "Heading 3": "Heading 3";
                List: "List";
            }>>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly replaceParagraph: {
        readonly name: "replaceParagraph";
        readonly description: "Replace the entire content of a paragraph.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            text: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly deleteParagraph: {
        readonly name: "deleteParagraph";
        readonly description: "Delete a paragraph by index.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly insertText: {
        readonly name: "insertText";
        readonly description: "Insert text at a specific position within the document.";
        readonly parameters: z.ZodObject<{
            text: z.ZodString;
            position: z.ZodObject<{
                paragraph: z.ZodNumber;
                character: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly deleteText: {
        readonly name: "deleteText";
        readonly description: "Delete text between two positions.";
        readonly parameters: z.ZodObject<{
            start: z.ZodObject<{
                paragraph: z.ZodNumber;
                character: z.ZodNumber;
            }, z.core.$strip>;
            end: z.ZodObject<{
                paragraph: z.ZodNumber;
                character: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly replaceText: {
        readonly name: "replaceText";
        readonly description: "Find and replace text within the document.";
        readonly parameters: z.ZodObject<{
            find: z.ZodString;
            replace: z.ZodString;
            paragraph: z.ZodOptional<z.ZodNumber>;
            all: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly formatText: {
        readonly name: "formatText";
        readonly description: "Apply formatting to a text range.";
        readonly parameters: z.ZodObject<{
            range: z.ZodObject<{
                start: z.ZodObject<{
                    paragraph: z.ZodNumber;
                    character: z.ZodNumber;
                }, z.core.$strip>;
                end: z.ZodObject<{
                    paragraph: z.ZodNumber;
                    character: z.ZodNumber;
                }, z.core.$strip>;
            }, z.core.$strip>;
            format: z.ZodObject<{
                bold: z.ZodOptional<z.ZodBoolean>;
                italic: z.ZodOptional<z.ZodBoolean>;
                underline: z.ZodOptional<z.ZodBoolean>;
                fontSize: z.ZodOptional<z.ZodNumber>;
                fontName: z.ZodOptional<z.ZodString>;
                color: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly getFormat: {
        readonly name: "getFormat";
        readonly description: "Get the text formatting at the current cursor position or selection.";
        readonly parameters: z.ZodObject<{
            position: z.ZodOptional<z.ZodObject<{
                paragraph: z.ZodNumber;
                character: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
};
declare const calcTools: {
    readonly getSheetNames: {
        readonly name: "getSheetNames";
        readonly description: "Get the names of all sheets in the workbook.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly getCell: {
        readonly name: "getCell";
        readonly description: "Get the value and formula of a single cell.";
        readonly parameters: z.ZodObject<{
            cell: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                row: z.ZodNumber;
                col: z.ZodNumber;
            }, z.core.$strip>]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly getCells: {
        readonly name: "getCells";
        readonly description: "Get values from a range of cells. Returns a 2D array.";
        readonly parameters: z.ZodObject<{
            range: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                start: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
                end: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
            }, z.core.$strip>]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            maxResponseChars: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly setCellValue: {
        readonly name: "setCellValue";
        readonly description: "Set the value of a single cell.";
        readonly parameters: z.ZodObject<{
            cell: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                row: z.ZodNumber;
                col: z.ZodNumber;
            }, z.core.$strip>]>;
            value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly setCellFormula: {
        readonly name: "setCellFormula";
        readonly description: "Set a formula in a cell. Formula should start with \"=\" (e.g., \"=SUM(A1:A10)\").";
        readonly parameters: z.ZodObject<{
            cell: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                row: z.ZodNumber;
                col: z.ZodNumber;
            }, z.core.$strip>]>;
            formula: z.ZodString;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly setCells: {
        readonly name: "setCells";
        readonly description: "Set values for multiple cells at once. Pass a 2D array of values.";
        readonly parameters: z.ZodObject<{
            range: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                start: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
                end: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
            }, z.core.$strip>]>;
            values: z.ZodArray<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly clearCell: {
        readonly name: "clearCell";
        readonly description: "Clear the contents of a cell.";
        readonly parameters: z.ZodObject<{
            cell: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                row: z.ZodNumber;
                col: z.ZodNumber;
            }, z.core.$strip>]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly clearRange: {
        readonly name: "clearRange";
        readonly description: "Clear the contents of a range of cells.";
        readonly parameters: z.ZodObject<{
            range: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                start: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
                end: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
            }, z.core.$strip>]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly insertRow: {
        readonly name: "insertRow";
        readonly description: "Insert a new row after the specified row.";
        readonly parameters: z.ZodObject<{
            afterRow: z.ZodNumber;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly insertColumn: {
        readonly name: "insertColumn";
        readonly description: "Insert a new column after the specified column.";
        readonly parameters: z.ZodObject<{
            afterCol: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly deleteRow: {
        readonly name: "deleteRow";
        readonly description: "Delete a row.";
        readonly parameters: z.ZodObject<{
            row: z.ZodNumber;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly deleteColumn: {
        readonly name: "deleteColumn";
        readonly description: "Delete a column.";
        readonly parameters: z.ZodObject<{
            col: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly formatCells: {
        readonly name: "formatCells";
        readonly description: "Apply formatting to a range of cells.";
        readonly parameters: z.ZodObject<{
            range: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                start: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
                end: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
            }, z.core.$strip>]>;
            format: z.ZodObject<{
                bold: z.ZodOptional<z.ZodBoolean>;
                numberFormat: z.ZodOptional<z.ZodString>;
                backgroundColor: z.ZodOptional<z.ZodString>;
                textColor: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly addSheet: {
        readonly name: "addSheet";
        readonly description: "Add a new sheet to the workbook.";
        readonly parameters: z.ZodObject<{
            name: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly renameSheet: {
        readonly name: "renameSheet";
        readonly description: "Rename an existing sheet.";
        readonly parameters: z.ZodObject<{
            sheet: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            newName: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly deleteSheet: {
        readonly name: "deleteSheet";
        readonly description: "Delete a sheet from the workbook.";
        readonly parameters: z.ZodObject<{
            sheet: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
};
declare const impressTools: {
    readonly getSlide: {
        readonly name: "getSlide";
        readonly description: "Get detailed content of a specific slide including title and text frames.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly getSlideCount: {
        readonly name: "getSlideCount";
        readonly description: "Get the total number of slides in the presentation.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly addSlide: {
        readonly name: "addSlide";
        readonly description: "Add a new slide to the presentation.";
        readonly parameters: z.ZodObject<{
            afterSlide: z.ZodOptional<z.ZodNumber>;
            layout: z.ZodOptional<z.ZodEnum<{
                blank: "blank";
                title: "title";
                titleContent: "titleContent";
                twoColumn: "twoColumn";
            }>>;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly deleteSlide: {
        readonly name: "deleteSlide";
        readonly description: "Delete a slide from the presentation. Cannot delete the last slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly duplicateSlide: {
        readonly name: "duplicateSlide";
        readonly description: "Create a copy of a slide. The copy is inserted after the original.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly moveSlide: {
        readonly name: "moveSlide";
        readonly description: "Move a slide to a different position.";
        readonly parameters: z.ZodObject<{
            fromIndex: z.ZodNumber;
            toIndex: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly setSlideTitle: {
        readonly name: "setSlideTitle";
        readonly description: "Set or replace the title text of a slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            title: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly setSlideBody: {
        readonly name: "setSlideBody";
        readonly description: "Set or replace the body text of a slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            body: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly setSlideNotes: {
        readonly name: "setSlideNotes";
        readonly description: "Set speaker notes for a slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            notes: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly setSlideLayout: {
        readonly name: "setSlideLayout";
        readonly description: "Change the layout of a slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            layout: z.ZodEnum<{
                blank: "blank";
                title: "title";
                titleContent: "titleContent";
                twoColumn: "twoColumn";
            }>;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
};
declare const drawTools: {
    readonly getPage: {
        readonly name: "getPage";
        readonly description: "Get detailed content of a specific page including shapes.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly getPageCount: {
        readonly name: "getPageCount";
        readonly description: "Get the total number of pages in the document.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly addPage: {
        readonly name: "addPage";
        readonly description: "Add a new page to the document.";
        readonly parameters: z.ZodObject<{
            afterPage: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly deletePage: {
        readonly name: "deletePage";
        readonly description: "Delete a page from the document. Cannot delete the last page.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly duplicatePage: {
        readonly name: "duplicatePage";
        readonly description: "Create a copy of a page. The copy is inserted after the original.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly addShape: {
        readonly name: "addShape";
        readonly description: "Add a shape to a page.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeType: z.ZodEnum<{
                text: "text";
                other: "other";
                image: "image";
                rectangle: "rectangle";
                ellipse: "ellipse";
                line: "line";
                group: "group";
            }>;
            bounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
            text: z.ZodOptional<z.ZodString>;
            fillColor: z.ZodOptional<z.ZodString>;
            lineColor: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly addLine: {
        readonly name: "addLine";
        readonly description: "Add a line to a page.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            start: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>;
            end: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>;
            lineColor: z.ZodOptional<z.ZodString>;
            lineWidth: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly deleteShape: {
        readonly name: "deleteShape";
        readonly description: "Delete a shape from a page.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeIndex: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly setShapeText: {
        readonly name: "setShapeText";
        readonly description: "Set or replace the text content of a shape.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeIndex: z.ZodNumber;
            text: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly moveShape: {
        readonly name: "moveShape";
        readonly description: "Move a shape to a new position.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeIndex: z.ZodNumber;
            position: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly resizeShape: {
        readonly name: "resizeShape";
        readonly description: "Resize a shape.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeIndex: z.ZodNumber;
            size: z.ZodObject<{
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
};
/**
 * High-level tools for document conversion, export, and rendering.
 * These operate at the document/page level rather than content editing.
 */
declare const documentTools: {
    readonly convertDocument: {
        readonly name: "convertDocument";
        readonly description: "Convert the entire document to a different format. Returns the converted document as binary data. Use this for format conversions like DOCX to PDF, XLSX to CSV, PPTX to PDF, etc.";
        readonly parameters: z.ZodObject<{
            outputFormat: z.ZodEnum<{
                png: "png";
                jpg: "jpg";
                svg: "svg";
                doc: "doc";
                docx: "docx";
                xls: "xls";
                xlsx: "xlsx";
                ppt: "ppt";
                pptx: "pptx";
                odt: "odt";
                ods: "ods";
                odp: "odp";
                rtf: "rtf";
                txt: "txt";
                html: "html";
                csv: "csv";
                pdf: "pdf";
            }>;
            options: z.ZodOptional<z.ZodObject<{
                pdfVersion: z.ZodOptional<z.ZodEnum<{
                    "PDF/A-1b": "PDF/A-1b";
                    "PDF/A-2b": "PDF/A-2b";
                    "PDF/A-3b": "PDF/A-3b";
                }>>;
                quality: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly renderPageToImage: {
        readonly name: "renderPageToImage";
        readonly description: "Render a specific page/slide to an image (PNG, JPG, or WebP). Useful for generating thumbnails, previews, or extracting visual content from documents.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            format: z.ZodDefault<z.ZodEnum<{
                png: "png";
                jpg: "jpg";
                webp: "webp";
            }>>;
            width: z.ZodDefault<z.ZodNumber>;
            height: z.ZodDefault<z.ZodNumber>;
            quality: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly getPageCount: {
        readonly name: "getPageCount";
        readonly description: "Get the total number of pages, slides, or sheets in the document. For Writer documents, returns page count. For Calc, returns sheet count. For Impress/Draw, returns slide/page count.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly exportPageToPdf: {
        readonly name: "exportPageToPdf";
        readonly description: "Export a specific page or range of pages to PDF. Useful for extracting a subset of pages from a larger document.";
        readonly parameters: z.ZodObject<{
            startPage: z.ZodNumber;
            endPage: z.ZodOptional<z.ZodNumber>;
            options: z.ZodOptional<z.ZodObject<{
                pdfVersion: z.ZodOptional<z.ZodEnum<{
                    "PDF/A-1b": "PDF/A-1b";
                    "PDF/A-2b": "PDF/A-2b";
                    "PDF/A-3b": "PDF/A-3b";
                }>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly getDocumentMetadata: {
        readonly name: "getDocumentMetadata";
        readonly description: "Get document metadata including title, author, creation date, modification date, page count, and document type.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly setDocumentMetadata: {
        readonly name: "setDocumentMetadata";
        readonly description: "Set document metadata such as title, author, subject, and keywords.";
        readonly parameters: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly exportToHtml: {
        readonly name: "exportToHtml";
        readonly description: "Export the document to HTML format. Useful for web publishing or extracting formatted content.";
        readonly parameters: z.ZodObject<{
            includeImages: z.ZodDefault<z.ZodBoolean>;
            inlineStyles: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly extractText: {
        readonly name: "extractText";
        readonly description: "Extract all text content from the document as plain text. Useful for indexing, searching, or text analysis.";
        readonly parameters: z.ZodObject<{
            preserveFormatting: z.ZodDefault<z.ZodBoolean>;
            pageRange: z.ZodOptional<z.ZodObject<{
                start: z.ZodNumber;
                end: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly printDocument: {
        readonly name: "printDocument";
        readonly description: "Generate print-ready output. Configures the document for printing with specified settings.";
        readonly parameters: z.ZodObject<{
            copies: z.ZodDefault<z.ZodNumber>;
            pageRange: z.ZodOptional<z.ZodString>;
            orientation: z.ZodOptional<z.ZodEnum<{
                portrait: "portrait";
                landscape: "landscape";
            }>>;
            paperSize: z.ZodOptional<z.ZodEnum<{
                letter: "letter";
                a4: "a4";
                legal: "legal";
                a3: "a3";
                a5: "a5";
            }>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
};
/**
 * Flat map of all tools by name
 */
declare const toolsByName: {
    readonly convertDocument: {
        readonly name: "convertDocument";
        readonly description: "Convert the entire document to a different format. Returns the converted document as binary data. Use this for format conversions like DOCX to PDF, XLSX to CSV, PPTX to PDF, etc.";
        readonly parameters: z.ZodObject<{
            outputFormat: z.ZodEnum<{
                png: "png";
                jpg: "jpg";
                svg: "svg";
                doc: "doc";
                docx: "docx";
                xls: "xls";
                xlsx: "xlsx";
                ppt: "ppt";
                pptx: "pptx";
                odt: "odt";
                ods: "ods";
                odp: "odp";
                rtf: "rtf";
                txt: "txt";
                html: "html";
                csv: "csv";
                pdf: "pdf";
            }>;
            options: z.ZodOptional<z.ZodObject<{
                pdfVersion: z.ZodOptional<z.ZodEnum<{
                    "PDF/A-1b": "PDF/A-1b";
                    "PDF/A-2b": "PDF/A-2b";
                    "PDF/A-3b": "PDF/A-3b";
                }>>;
                quality: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly renderPageToImage: {
        readonly name: "renderPageToImage";
        readonly description: "Render a specific page/slide to an image (PNG, JPG, or WebP). Useful for generating thumbnails, previews, or extracting visual content from documents.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            format: z.ZodDefault<z.ZodEnum<{
                png: "png";
                jpg: "jpg";
                webp: "webp";
            }>>;
            width: z.ZodDefault<z.ZodNumber>;
            height: z.ZodDefault<z.ZodNumber>;
            quality: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly getPageCount: {
        readonly name: "getPageCount";
        readonly description: "Get the total number of pages, slides, or sheets in the document. For Writer documents, returns page count. For Calc, returns sheet count. For Impress/Draw, returns slide/page count.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly exportPageToPdf: {
        readonly name: "exportPageToPdf";
        readonly description: "Export a specific page or range of pages to PDF. Useful for extracting a subset of pages from a larger document.";
        readonly parameters: z.ZodObject<{
            startPage: z.ZodNumber;
            endPage: z.ZodOptional<z.ZodNumber>;
            options: z.ZodOptional<z.ZodObject<{
                pdfVersion: z.ZodOptional<z.ZodEnum<{
                    "PDF/A-1b": "PDF/A-1b";
                    "PDF/A-2b": "PDF/A-2b";
                    "PDF/A-3b": "PDF/A-3b";
                }>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly getDocumentMetadata: {
        readonly name: "getDocumentMetadata";
        readonly description: "Get document metadata including title, author, creation date, modification date, page count, and document type.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly setDocumentMetadata: {
        readonly name: "setDocumentMetadata";
        readonly description: "Set document metadata such as title, author, subject, and keywords.";
        readonly parameters: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodString>;
            subject: z.ZodOptional<z.ZodString>;
            keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly exportToHtml: {
        readonly name: "exportToHtml";
        readonly description: "Export the document to HTML format. Useful for web publishing or extracting formatted content.";
        readonly parameters: z.ZodObject<{
            includeImages: z.ZodDefault<z.ZodBoolean>;
            inlineStyles: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly extractText: {
        readonly name: "extractText";
        readonly description: "Extract all text content from the document as plain text. Useful for indexing, searching, or text analysis.";
        readonly parameters: z.ZodObject<{
            preserveFormatting: z.ZodDefault<z.ZodBoolean>;
            pageRange: z.ZodOptional<z.ZodObject<{
                start: z.ZodNumber;
                end: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly printDocument: {
        readonly name: "printDocument";
        readonly description: "Generate print-ready output. Configures the document for printing with specified settings.";
        readonly parameters: z.ZodObject<{
            copies: z.ZodDefault<z.ZodNumber>;
            pageRange: z.ZodOptional<z.ZodString>;
            orientation: z.ZodOptional<z.ZodEnum<{
                portrait: "portrait";
                landscape: "landscape";
            }>>;
            paperSize: z.ZodOptional<z.ZodEnum<{
                letter: "letter";
                a4: "a4";
                legal: "legal";
                a3: "a3";
                a5: "a5";
            }>>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly getPage: {
        readonly name: "getPage";
        readonly description: "Get detailed content of a specific page including shapes.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly addPage: {
        readonly name: "addPage";
        readonly description: "Add a new page to the document.";
        readonly parameters: z.ZodObject<{
            afterPage: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly deletePage: {
        readonly name: "deletePage";
        readonly description: "Delete a page from the document. Cannot delete the last page.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly duplicatePage: {
        readonly name: "duplicatePage";
        readonly description: "Create a copy of a page. The copy is inserted after the original.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly addShape: {
        readonly name: "addShape";
        readonly description: "Add a shape to a page.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeType: z.ZodEnum<{
                text: "text";
                other: "other";
                image: "image";
                rectangle: "rectangle";
                ellipse: "ellipse";
                line: "line";
                group: "group";
            }>;
            bounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
            text: z.ZodOptional<z.ZodString>;
            fillColor: z.ZodOptional<z.ZodString>;
            lineColor: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly addLine: {
        readonly name: "addLine";
        readonly description: "Add a line to a page.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            start: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>;
            end: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>;
            lineColor: z.ZodOptional<z.ZodString>;
            lineWidth: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly deleteShape: {
        readonly name: "deleteShape";
        readonly description: "Delete a shape from a page.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeIndex: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly setShapeText: {
        readonly name: "setShapeText";
        readonly description: "Set or replace the text content of a shape.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeIndex: z.ZodNumber;
            text: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly moveShape: {
        readonly name: "moveShape";
        readonly description: "Move a shape to a new position.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeIndex: z.ZodNumber;
            position: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly resizeShape: {
        readonly name: "resizeShape";
        readonly description: "Resize a shape.";
        readonly parameters: z.ZodObject<{
            pageIndex: z.ZodNumber;
            shapeIndex: z.ZodNumber;
            size: z.ZodObject<{
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["draw"];
    };
    readonly getSlide: {
        readonly name: "getSlide";
        readonly description: "Get detailed content of a specific slide including title and text frames.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly getSlideCount: {
        readonly name: "getSlideCount";
        readonly description: "Get the total number of slides in the presentation.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly addSlide: {
        readonly name: "addSlide";
        readonly description: "Add a new slide to the presentation.";
        readonly parameters: z.ZodObject<{
            afterSlide: z.ZodOptional<z.ZodNumber>;
            layout: z.ZodOptional<z.ZodEnum<{
                blank: "blank";
                title: "title";
                titleContent: "titleContent";
                twoColumn: "twoColumn";
            }>>;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly deleteSlide: {
        readonly name: "deleteSlide";
        readonly description: "Delete a slide from the presentation. Cannot delete the last slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly duplicateSlide: {
        readonly name: "duplicateSlide";
        readonly description: "Create a copy of a slide. The copy is inserted after the original.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly moveSlide: {
        readonly name: "moveSlide";
        readonly description: "Move a slide to a different position.";
        readonly parameters: z.ZodObject<{
            fromIndex: z.ZodNumber;
            toIndex: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly setSlideTitle: {
        readonly name: "setSlideTitle";
        readonly description: "Set or replace the title text of a slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            title: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly setSlideBody: {
        readonly name: "setSlideBody";
        readonly description: "Set or replace the body text of a slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            body: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly setSlideNotes: {
        readonly name: "setSlideNotes";
        readonly description: "Set speaker notes for a slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            notes: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly setSlideLayout: {
        readonly name: "setSlideLayout";
        readonly description: "Change the layout of a slide.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            layout: z.ZodEnum<{
                blank: "blank";
                title: "title";
                titleContent: "titleContent";
                twoColumn: "twoColumn";
            }>;
        }, z.core.$strip>;
        readonly documentTypes: ["impress"];
    };
    readonly getSheetNames: {
        readonly name: "getSheetNames";
        readonly description: "Get the names of all sheets in the workbook.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly getCell: {
        readonly name: "getCell";
        readonly description: "Get the value and formula of a single cell.";
        readonly parameters: z.ZodObject<{
            cell: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                row: z.ZodNumber;
                col: z.ZodNumber;
            }, z.core.$strip>]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly getCells: {
        readonly name: "getCells";
        readonly description: "Get values from a range of cells. Returns a 2D array.";
        readonly parameters: z.ZodObject<{
            range: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                start: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
                end: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
            }, z.core.$strip>]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            maxResponseChars: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly setCellValue: {
        readonly name: "setCellValue";
        readonly description: "Set the value of a single cell.";
        readonly parameters: z.ZodObject<{
            cell: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                row: z.ZodNumber;
                col: z.ZodNumber;
            }, z.core.$strip>]>;
            value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly setCellFormula: {
        readonly name: "setCellFormula";
        readonly description: "Set a formula in a cell. Formula should start with \"=\" (e.g., \"=SUM(A1:A10)\").";
        readonly parameters: z.ZodObject<{
            cell: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                row: z.ZodNumber;
                col: z.ZodNumber;
            }, z.core.$strip>]>;
            formula: z.ZodString;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly setCells: {
        readonly name: "setCells";
        readonly description: "Set values for multiple cells at once. Pass a 2D array of values.";
        readonly parameters: z.ZodObject<{
            range: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                start: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
                end: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
            }, z.core.$strip>]>;
            values: z.ZodArray<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly clearCell: {
        readonly name: "clearCell";
        readonly description: "Clear the contents of a cell.";
        readonly parameters: z.ZodObject<{
            cell: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                row: z.ZodNumber;
                col: z.ZodNumber;
            }, z.core.$strip>]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly clearRange: {
        readonly name: "clearRange";
        readonly description: "Clear the contents of a range of cells.";
        readonly parameters: z.ZodObject<{
            range: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                start: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
                end: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
            }, z.core.$strip>]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly insertRow: {
        readonly name: "insertRow";
        readonly description: "Insert a new row after the specified row.";
        readonly parameters: z.ZodObject<{
            afterRow: z.ZodNumber;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly insertColumn: {
        readonly name: "insertColumn";
        readonly description: "Insert a new column after the specified column.";
        readonly parameters: z.ZodObject<{
            afterCol: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly deleteRow: {
        readonly name: "deleteRow";
        readonly description: "Delete a row.";
        readonly parameters: z.ZodObject<{
            row: z.ZodNumber;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly deleteColumn: {
        readonly name: "deleteColumn";
        readonly description: "Delete a column.";
        readonly parameters: z.ZodObject<{
            col: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly formatCells: {
        readonly name: "formatCells";
        readonly description: "Apply formatting to a range of cells.";
        readonly parameters: z.ZodObject<{
            range: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                start: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
                end: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    row: z.ZodNumber;
                    col: z.ZodNumber;
                }, z.core.$strip>]>;
            }, z.core.$strip>]>;
            format: z.ZodObject<{
                bold: z.ZodOptional<z.ZodBoolean>;
                numberFormat: z.ZodOptional<z.ZodString>;
                backgroundColor: z.ZodOptional<z.ZodString>;
                textColor: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly addSheet: {
        readonly name: "addSheet";
        readonly description: "Add a new sheet to the workbook.";
        readonly parameters: z.ZodObject<{
            name: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly renameSheet: {
        readonly name: "renameSheet";
        readonly description: "Rename an existing sheet.";
        readonly parameters: z.ZodObject<{
            sheet: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            newName: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly deleteSheet: {
        readonly name: "deleteSheet";
        readonly description: "Delete a sheet from the workbook.";
        readonly parameters: z.ZodObject<{
            sheet: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
        }, z.core.$strip>;
        readonly documentTypes: ["calc"];
    };
    readonly getParagraph: {
        readonly name: "getParagraph";
        readonly description: "Get a single paragraph by its index. Use getStructure() first to see available paragraphs.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly getParagraphs: {
        readonly name: "getParagraphs";
        readonly description: "Get a range of paragraphs. Useful for paginating through large documents.";
        readonly parameters: z.ZodObject<{
            start: z.ZodNumber;
            count: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly insertParagraph: {
        readonly name: "insertParagraph";
        readonly description: "Insert a new paragraph with optional styling.";
        readonly parameters: z.ZodObject<{
            text: z.ZodString;
            afterIndex: z.ZodOptional<z.ZodNumber>;
            style: z.ZodOptional<z.ZodEnum<{
                Normal: "Normal";
                "Heading 1": "Heading 1";
                "Heading 2": "Heading 2";
                "Heading 3": "Heading 3";
                List: "List";
            }>>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly replaceParagraph: {
        readonly name: "replaceParagraph";
        readonly description: "Replace the entire content of a paragraph.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
            text: z.ZodString;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly deleteParagraph: {
        readonly name: "deleteParagraph";
        readonly description: "Delete a paragraph by index.";
        readonly parameters: z.ZodObject<{
            index: z.ZodNumber;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly insertText: {
        readonly name: "insertText";
        readonly description: "Insert text at a specific position within the document.";
        readonly parameters: z.ZodObject<{
            text: z.ZodString;
            position: z.ZodObject<{
                paragraph: z.ZodNumber;
                character: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly deleteText: {
        readonly name: "deleteText";
        readonly description: "Delete text between two positions.";
        readonly parameters: z.ZodObject<{
            start: z.ZodObject<{
                paragraph: z.ZodNumber;
                character: z.ZodNumber;
            }, z.core.$strip>;
            end: z.ZodObject<{
                paragraph: z.ZodNumber;
                character: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly replaceText: {
        readonly name: "replaceText";
        readonly description: "Find and replace text within the document.";
        readonly parameters: z.ZodObject<{
            find: z.ZodString;
            replace: z.ZodString;
            paragraph: z.ZodOptional<z.ZodNumber>;
            all: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly formatText: {
        readonly name: "formatText";
        readonly description: "Apply formatting to a text range.";
        readonly parameters: z.ZodObject<{
            range: z.ZodObject<{
                start: z.ZodObject<{
                    paragraph: z.ZodNumber;
                    character: z.ZodNumber;
                }, z.core.$strip>;
                end: z.ZodObject<{
                    paragraph: z.ZodNumber;
                    character: z.ZodNumber;
                }, z.core.$strip>;
            }, z.core.$strip>;
            format: z.ZodObject<{
                bold: z.ZodOptional<z.ZodBoolean>;
                italic: z.ZodOptional<z.ZodBoolean>;
                underline: z.ZodOptional<z.ZodBoolean>;
                fontSize: z.ZodOptional<z.ZodNumber>;
                fontName: z.ZodOptional<z.ZodString>;
                color: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly getFormat: {
        readonly name: "getFormat";
        readonly description: "Get the text formatting at the current cursor position or selection.";
        readonly parameters: z.ZodObject<{
            position: z.ZodOptional<z.ZodObject<{
                paragraph: z.ZodNumber;
                character: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        readonly documentTypes: ["writer"];
    };
    readonly getStructure: {
        readonly name: "getStructure";
        readonly description: "Get the document structure including paragraphs, sheets, slides, or pages depending on document type. Returns an overview of the document content.";
        readonly parameters: z.ZodObject<{
            maxResponseChars: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly save: {
        readonly name: "save";
        readonly description: "Save changes to the document at its original path.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly saveAs: {
        readonly name: "saveAs";
        readonly description: "Save the document to a new path with optional format conversion.";
        readonly parameters: z.ZodObject<{
            path: z.ZodString;
            format: z.ZodEnum<{
                png: "png";
                jpg: "jpg";
                svg: "svg";
                doc: "doc";
                docx: "docx";
                xls: "xls";
                xlsx: "xlsx";
                ppt: "ppt";
                pptx: "pptx";
                odt: "odt";
                ods: "ods";
                odp: "odp";
                rtf: "rtf";
                txt: "txt";
                html: "html";
                csv: "csv";
                pdf: "pdf";
            }>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly close: {
        readonly name: "close";
        readonly description: "Close the document and release resources.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly undo: {
        readonly name: "undo";
        readonly description: "Undo the last edit operation.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly redo: {
        readonly name: "redo";
        readonly description: "Redo the previously undone operation.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly find: {
        readonly name: "find";
        readonly description: "Find text in the document. Returns match count and position of first match.";
        readonly parameters: z.ZodObject<{
            text: z.ZodString;
            caseSensitive: z.ZodOptional<z.ZodBoolean>;
            wholeWord: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly findAndReplaceAll: {
        readonly name: "findAndReplaceAll";
        readonly description: "Find all occurrences of text and replace them.";
        readonly parameters: z.ZodObject<{
            find: z.ZodString;
            replace: z.ZodString;
            caseSensitive: z.ZodOptional<z.ZodBoolean>;
            wholeWord: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly getSelection: {
        readonly name: "getSelection";
        readonly description: "Get the currently selected text or range.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly clearSelection: {
        readonly name: "clearSelection";
        readonly description: "Clear the current selection.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly enableEditMode: {
        readonly name: "enableEditMode";
        readonly description: "Enable edit mode for the document. Required before making changes.";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
    readonly getEditMode: {
        readonly name: "getEditMode";
        readonly description: "Get the current edit mode (0 = view, 1 = edit).";
        readonly parameters: z.ZodObject<{}, z.core.$strip>;
        readonly documentTypes: ["all"];
    };
};
type CommonToolName = keyof typeof commonTools;
type WriterToolName = keyof typeof writerTools;
type CalcToolName = keyof typeof calcTools;
type ImpressToolName = keyof typeof impressTools;
type DrawToolName = keyof typeof drawTools;
type DocumentToolName = keyof typeof documentTools;
type AllToolName = CommonToolName | WriterToolName | CalcToolName | ImpressToolName | DrawToolName | DocumentToolName;
type ToolParameters<T extends AllToolName> = z.infer<(typeof toolsByName)[T]['parameters']>;

/**
 * Image format options for encoding
 */
interface ImageEncodeOptions {
    /** Output format */
    format: 'png' | 'jpeg' | 'webp';
    /** Quality for lossy formats (1-100), default 90 */
    quality?: number;
    /** Compression level for PNG (0-9), default 6 */
    compressionLevel?: number;
}

/**
 * LibreOffice WASM Document Converter - Types Only
 *
 * This entry point exports only types, no runtime code.
 * Safe to import from client components without pulling in Node.js dependencies.
 *
 * @example
 * ```typescript
 * // In client components (React, Vue, etc.)
 * import type { ConversionOptions, OutputFormat } from '@matbee/libreoffice-converter/types';
 * ```
 *
 * @packageDocumentation
 */

/**
 * Image format options for exportAsImage
 */
type ImageFormat = 'png' | 'jpg' | 'svg';

export { type AllToolName, type BrowserConverterOptions, type BrowserWasmPaths, CATEGORY_OUTPUT_FORMATS, type CalcStructure, type CalcToolName, type CellData, type CellFormat, type CellRef, type CellValue, type ColRef, type CommonToolName, ConversionError, ConversionErrorCode, type ConversionOptions, type ConversionResult, DEFAULT_WASM_BASE_URL, type DocumentCategory, type DocumentInfo, type DocumentMetadata, type DocumentStructure, type DocumentToolName, type DocumentType, type DrawStructure, type DrawToolName, EXTENSION_TO_FORMAT, type EditorOperationResult, type EditorSession, type EmscriptenFS, type EmscriptenModule, FORMAT_FILTERS, FORMAT_MIME_TYPES, type FindOptions, type FullQualityPagePreview, type FullQualityRenderOptions, type ILibreOfficeConverter, INPUT_FORMAT_CATEGORY, type ImageEncodeOptions, type ImageFormat, type ImageOptions, type ImpressStructure, type ImpressToolName, type InputFormat, type InputFormatOptions, LOKDocumentType, LOK_DOCTYPE_OUTPUT_FORMATS, type LibreOfficeWasmOptions, type OpenDocumentOptions, type OperationResult, type OutputFormat, type PageData, type PageInfo, type PagePreview, type Paragraph, type PdfOptions, type Position, type ProgressInfo, type RangeRef, type Rectangle, type RenderOptions, type SelectionRange, type ShapeData, type ShapeType, type SheetInfo, type SheetRef, type Size, type SlideData, type SlideInfo, type SlideLayout, type TextFormat, type TextFrame, type TextPosition, type TextRange, type ToolDefinition, type ToolParameters, type TruncationInfo, type WasmLoadPhase, type WasmLoadProgress, type WorkerBrowserConverterOptions, type WriterStructure, type WriterToolName, createWasmPaths, getConversionErrorMessage, getOutputFormatsForDocType, getValidOutputFormats, isConversionValid };
