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
 * LibreOffice WASM Document Converter - Node.js Version
 *
 * This is the Node.js-specific version that requires wasmLoader to be provided.
 * For browser usage, use converter.ts instead.
 */

/**
 * LibreOffice WASM Document Converter - Node.js Version
 *
 * A headless document conversion toolkit that uses LibreOffice
 * compiled to WebAssembly. This version is optimized for Node.js
 * with static imports that work with ESM bundlers.
 */
declare class LibreOfficeConverter implements ILibreOfficeConverter {
    private module;
    private lokBindings;
    private initialized;
    private initializing;
    private options;
    private corrupted;
    private fsTracked;
    constructor(options?: LibreOfficeWasmOptions);
    /**
     * Check if an error indicates LOK corruption requiring reinitialization
     */
    private isCorruptionError;
    /**
     * Force reinitialization of the converter (for recovery from errors)
     */
    reinitialize(): Promise<void>;
    /**
     * Initialize with a pre-loaded Emscripten module
     * This is useful for environments like Web Workers that have their own
     * WASM loading mechanism (e.g., importScripts with progress tracking)
     */
    initializeWithModule(module: EmscriptenModule): Promise<void>;
    /**
     * Initialize the LibreOffice WASM module
     */
    initialize(): Promise<void>;
    /**
     * Load the Emscripten WASM module (Node.js only)
     * Requires wasmLoader option to be provided for bundler compatibility
     */
    private loadModule;
    /**
     * Set up the virtual filesystem
     */
    private setupFileSystem;
    /**
     * Initialize LibreOfficeKit
     */
    private initializeLibreOfficeKit;
    /**
     * Convert a document to a different format
     */
    convert(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions, filename?: string): Promise<ConversionResult>;
    /**
     * Perform the actual conversion using LibreOfficeKit
     */
    private performConversion;
    /**
     * Render page previews (thumbnails) for a document
     */
    renderPagePreviews(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions, renderOptions?: RenderOptions): Promise<PagePreview[]>;
    /**
     * Render a page at full quality (native resolution based on DPI)
     */
    renderPageFullQuality(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions, pageIndex: number, renderOptions?: FullQualityRenderOptions): Promise<FullQualityPagePreview>;
    /**
     * Get the number of pages/parts in a document
     */
    getPageCount(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions): Promise<number>;
    /**
     * Get valid output formats for a document by loading it and checking its type
     */
    getDocumentInfo(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions): Promise<DocumentInfo>;
    getDocumentText(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions): Promise<string | null>;
    getPageNames(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions): Promise<string[]>;
    getPageRectangles(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions): Promise<Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>>;
    getSpreadsheetDataArea(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions, sheetIndex?: number): Promise<{
        col: number;
        row: number;
    }>;
    executeUnoCommand(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions, command: string, args?: string): Promise<void>;
    renderPage(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions, pageIndex: number, width: number, height?: number): Promise<PagePreview>;
    openDocument(_input: Uint8Array | ArrayBuffer, _options: InputFormatOptions): Promise<EditorSession>;
    editorOperation<T = unknown>(_sessionId: string, _method: string, _args?: unknown[]): Promise<EditorOperationResult<T>>;
    closeDocument(_sessionId: string): Promise<Uint8Array | undefined>;
    getLokBindings(): typeof this.lokBindings;
    destroy(): Promise<void>;
    isReady(): boolean;
    getModule(): EmscriptenModule | null;
    static getSupportedInputFormats(): string[];
    static getSupportedOutputFormats(): OutputFormat[];
    static getValidOutputFormats(inputFormat: string): OutputFormat[];
    static isConversionSupported(inputFormat: string, outputFormat: string): boolean;
    private normalizeInput;
    private getExtensionFromFilename;
    private getBasename;
    private emitProgress;
}

/**
 * Worker-based LibreOffice Converter
 *
 * This converter runs the WASM module in a Worker thread to avoid
 * blocking the main Node.js event loop.
 */

/**
 * Worker-based LibreOffice Converter
 * Uses a separate thread to avoid blocking the main event loop
 */
declare class WorkerConverter implements ILibreOfficeConverter {
    private worker;
    private pending;
    private options;
    private initialized;
    private initializing;
    constructor(options?: LibreOfficeWasmOptions);
    /**
     * Initialize the converter
     */
    initialize(): Promise<void>;
    /**
     * Send a message to the worker and wait for response
     */
    private sendMessage;
    /**
     * Convert a document
     */
    convert(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions, filename?: string): Promise<ConversionResult>;
    /**
     * Get the number of pages in a document
     */
    getPageCount(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions): Promise<number>;
    /**
     * Get document information including type and valid output formats
     */
    getDocumentInfo(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions): Promise<DocumentInfo>;
    /**
     * Render a single page as an image
     */
    renderPage(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions, pageIndex: number, width: number, height?: number): Promise<PagePreview>;
    /**
     * Render multiple page previews
     */
    renderPagePreviews(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions, renderOptions?: RenderOptions): Promise<PagePreview[]>;
    /**
     * Render a page at full quality (native resolution based on DPI)
     * @param input Document data
     * @param options Must include inputFormat
     * @param pageIndex Zero-based page index to render
     * @param renderOptions DPI and max dimension settings
     * @returns Full quality page preview with RGBA data and DPI info
     */
    renderPageFullQuality(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions, pageIndex: number, renderOptions?: FullQualityRenderOptions): Promise<FullQualityPagePreview>;
    /**
     * Extract text content from a document
     */
    getDocumentText(input: Uint8Array | ArrayBuffer | Buffer, inputFormat: string): Promise<string | null>;
    /**
     * Get page/slide names from a document
     */
    getPageNames(input: Uint8Array | ArrayBuffer | Buffer, inputFormat: string): Promise<string[]>;
    /**
     * Open a document for editing
     * Returns a session ID that can be used for subsequent editor operations
     */
    openDocument(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions): Promise<EditorSession>;
    /**
     * Execute an editor operation on an open document session
     * @param sessionId - The session ID from openDocument
     * @param method - The editor method to call (e.g., 'insertParagraph', 'getStructure')
     * @param args - Arguments to pass to the method
     */
    editorOperation<T = unknown>(sessionId: string, method: string, args?: unknown[]): Promise<EditorOperationResult<T>>;
    /**
     * Close an editor session and get the modified document
     * @param sessionId - The session ID from openDocument
     * @returns The modified document data, or undefined if save failed
     */
    closeDocument(sessionId: string): Promise<Uint8Array | undefined>;
    /**
     * Destroy the converter and terminate the worker
     */
    destroy(): Promise<void>;
    /**
     * Check if the converter is ready
     */
    isReady(): boolean;
    private normalizeInput;
    private getExtensionFromFilename;
    private getBasename;
}
/**
 * Create and initialize a worker-based converter
 */
declare function createWorkerConverter(options?: LibreOfficeWasmOptions): Promise<WorkerConverter>;

/**
 * Forked Process LibreOffice Converter
 *
 * Runs the WASM module in a completely separate Node.js process.
 * Includes retry logic for handling transient WASM memory errors.
 */

interface SubprocessConverterOptions extends LibreOfficeWasmOptions {
    /** Max retries for initialization (default: 3) */
    maxInitRetries?: number;
    /** Max retries for conversion (default: 2) */
    maxConversionRetries?: number;
    /** Whether to restart subprocess on memory errors (default: true) */
    restartOnMemoryError?: boolean;
}
declare class SubprocessConverter implements ILibreOfficeConverter {
    private child;
    private pending;
    private options;
    private initialized;
    private initializing;
    private workerPath;
    constructor(options?: SubprocessConverterOptions);
    private isMemoryError;
    private spawnWorker;
    private killWorker;
    initialize(): Promise<void>;
    private send;
    private normalizeInput;
    convert(input: Uint8Array | ArrayBuffer | Buffer, options: ConversionOptions, filename?: string): Promise<ConversionResult>;
    /**
     * Get the number of pages in a document
     */
    getPageCount(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions): Promise<number>;
    /**
     * Get document information including type and valid output formats
     */
    getDocumentInfo(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions): Promise<DocumentInfo>;
    /**
     * Render a single page as an image
     */
    renderPage(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions, pageIndex: number, width: number, height?: number): Promise<PagePreview>;
    /**
     * Render multiple page previews
     */
    renderPagePreviews(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions, renderOptions?: RenderOptions): Promise<PagePreview[]>;
    /**
     * Render a page at full quality (native resolution based on DPI)
     * @param input Document data
     * @param options Must include inputFormat
     * @param pageIndex Zero-based page index to render
     * @param renderOptions DPI and max dimension settings
     * @returns Full quality page preview with RGBA data and DPI info
     */
    renderPageFullQuality(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions, pageIndex: number, renderOptions?: FullQualityRenderOptions): Promise<FullQualityPagePreview>;
    /**
     * Extract text content from a document
     */
    getDocumentText(input: Uint8Array | ArrayBuffer | Buffer, inputFormat: string): Promise<string | null>;
    /**
     * Get page/slide names from a document
     */
    getPageNames(input: Uint8Array | ArrayBuffer | Buffer, inputFormat: string): Promise<string[]>;
    /**
     * Open a document for editing
     * Returns a session ID that can be used for subsequent editor operations
     */
    openDocument(input: Uint8Array | ArrayBuffer | Buffer, options: InputFormatOptions): Promise<EditorSession>;
    /**
     * Execute an editor operation on an open document session
     * @param sessionId - The session ID from openDocument
     * @param method - The editor method to call (e.g., 'insertParagraph', 'getStructure')
     * @param args - Arguments to pass to the method
     */
    editorOperation<T = unknown>(sessionId: string, method: string, args?: unknown[]): Promise<EditorOperationResult<T>>;
    /**
     * Close an editor session and get the modified document
     * @param sessionId - The session ID from openDocument
     * @returns The modified document data, or undefined if save failed
     */
    closeDocument(sessionId: string): Promise<Uint8Array | undefined>;
    destroy(): Promise<void>;
    isReady(): boolean;
}
declare function createSubprocessConverter(options?: SubprocessConverterOptions): Promise<SubprocessConverter>;

/**
 * Image encoding utilities for converting raw RGBA pixel data to image formats.
 * Uses sharp when available for high performance, falls back to pure JS implementation.
 */
/** Sharp function type for creating sharp instances */
type SharpFunction = (input: Buffer | Uint8Array, options?: {
    raw?: {
        width: number;
        height: number;
        channels: number;
    };
}) => SharpInstance;
/** Sharp instance with chained methods */
interface SharpInstance {
    png(options?: {
        compressionLevel?: number;
    }): SharpInstance;
    jpeg(options?: {
        quality?: number;
    }): SharpInstance;
    webp(options?: {
        quality?: number;
    }): SharpInstance;
    toBuffer(): Promise<Buffer>;
}
/**
 * Check if sharp is available
 */
declare function isSharpAvailable(): Promise<boolean>;
/**
 * Get the sharp module if available
 * @returns sharp function or null if not installed
 */
declare function getSharp(): Promise<SharpFunction | null>;
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
 * Convert raw RGBA pixel data to an encoded image format.
 * Uses sharp when available for high performance, falls back to pure JS PNG encoder.
 *
 * @param rgbaData - Raw RGBA pixel data (4 bytes per pixel)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param options - Encoding options (format, quality)
 * @returns Encoded image data as Buffer
 *
 * @example
 * ```typescript
 * import { encodeImage } from '@matbee/libreoffice-converter';
 *
 * const preview = await converter.renderPage(docBuffer, 'docx', 0, 800);
 * const pngBuffer = await encodeImage(preview.data, preview.width, preview.height, { format: 'png' });
 * fs.writeFileSync('page.png', pngBuffer);
 * ```
 */
declare function encodeImage(rgbaData: Uint8Array, width: number, height: number, options?: ImageEncodeOptions): Promise<Buffer>;
/**
 * Convenience function to encode RGBA data to PNG
 * @param rgbaData - Raw RGBA pixel data
 * @param width - Image width
 * @param height - Image height
 * @returns PNG encoded Buffer
 */
declare function rgbaToPng(rgbaData: Uint8Array, width: number, height: number): Promise<Buffer>;
/**
 * Convenience function to encode RGBA data to JPEG (requires sharp)
 * @param rgbaData - Raw RGBA pixel data
 * @param width - Image width
 * @param height - Image height
 * @param quality - JPEG quality (1-100), default 90
 * @returns JPEG encoded Buffer
 */
declare function rgbaToJpeg(rgbaData: Uint8Array, width: number, height: number, quality?: number): Promise<Buffer>;
/**
 * Convenience function to encode RGBA data to WebP (requires sharp)
 * @param rgbaData - Raw RGBA pixel data
 * @param width - Image width
 * @param height - Image height
 * @param quality - WebP quality (1-100), default 90
 * @returns WebP encoded Buffer
 */
declare function rgbaToWebp(rgbaData: Uint8Array, width: number, height: number, quality?: number): Promise<Buffer>;

/**
 * LibreOfficeKit Low-Level Bindings
 *
 * This module provides direct access to the LibreOfficeKit C API
 * through the WASM module using the stable lok_* shim exports.
 *
 * Shim functions (C side) should be defined as:
 *   - lok_documentLoad(pKit, pPath)
 *   - lok_documentLoadWithOptions(pKit, pPath, pOptions)
 *   - lok_documentSaveAs(pDoc, pUrl, pFormat, pFilterOptions)
 *   - lok_documentDestroy(pDoc)
 *   - lok_getError(pKit)
 *   - lok_destroy(pKit)          <-- RECOMMENDED to add
 */

declare const LOK_MOUSEEVENT_BUTTONDOWN = 0;
declare const LOK_MOUSEEVENT_BUTTONUP = 1;
declare const LOK_MOUSEEVENT_MOVE = 2;
declare const LOK_KEYEVENT_KEYINPUT = 0;
declare const LOK_KEYEVENT_KEYUP = 1;
declare const LOK_SELTYPE_NONE = 0;
declare const LOK_SELTYPE_TEXT = 1;
declare const LOK_SELTYPE_CELL = 2;
declare const LOK_SETTEXTSELECTION_START = 0;
declare const LOK_SETTEXTSELECTION_END = 1;
declare const LOK_SETTEXTSELECTION_RESET = 2;
declare const LOK_DOCTYPE_TEXT = 0;
declare const LOK_DOCTYPE_SPREADSHEET = 1;
declare const LOK_DOCTYPE_PRESENTATION = 2;
declare const LOK_DOCTYPE_DRAWING = 3;
declare const LOK_DOCTYPE_OTHER = 4;
interface LOKCallbackEvent {
    type: number;
    typeName: string;
    payload: string;
}
declare class LOKBindings {
    private module;
    private lokPtr;
    private verbose;
    private useShims;
    constructor(module: EmscriptenModule, verbose?: boolean);
    private log;
    /**
     * Get fresh heap views (important after memory growth!)
     */
    private get HEAPU8();
    private get HEAPU32();
    private get HEAP32();
    /**
     * Allocate a null-terminated string in WASM memory
     */
    allocString(str: string): number;
    /**
     * Read a null-terminated string from WASM memory
     */
    readString(ptr: number): string | null;
    /**
     * Read a 32-bit pointer from memory (unsigned)
     */
    readPtr(addr: number): number;
    /**
     * Get a function from the WASM table (fallback for vtable traversal)
     */
    private getFunc;
    /**
     * Initialize LibreOfficeKit
     */
    initialize(installPath?: string): void;
    /**
     * Get the last error message
     */
    getError(): string | null;
    /**
     * Get version info
     */
    getVersionInfo(): string | null;
    /**
     * Convert a filesystem path to a file:// URL
     * Required by LibreOffice's getAbsoluteURL() which uses rtl::Uri::convertRelToAbs()
     */
    private toFileUrl;
    /**
     * Load a document from the virtual filesystem
     */
    documentLoad(path: string): number;
    /**
     * Load a document with options
     */
    documentLoadWithOptions(path: string, options: string): number;
    /**
     * Save a document to a different format
     */
    documentSaveAs(docPtr: number, outputPath: string, format: string, filterOptions?: string): void;
    /**
     * Destroy a document
     */
    documentDestroy(docPtr: number): void;
    /**
     * Destroy the LOK instance
     */
    destroy(): void;
    /**
     * Check if LOK is initialized
     */
    isInitialized(): boolean;
    /**
     * Check if using direct shim exports
     */
    isUsingShims(): boolean;
    /**
     * Get the number of parts (pages/slides) in a document
     */
    documentGetParts(docPtr: number): number;
    /**
     * Get the current part (page/slide) index
     */
    documentGetPart(docPtr: number): number;
    /**
     * Set the current part (page/slide) index
     */
    documentSetPart(docPtr: number, part: number): void;
    /**
     * Get document type (0=text, 1=spreadsheet, 2=presentation, 3=drawing)
     */
    documentGetDocumentType(docPtr: number): number;
    /**
     * Get document size in twips (1/1440 inch)
     */
    documentGetDocumentSize(docPtr: number): {
        width: number;
        height: number;
    };
    /**
     * Initialize document for rendering
     */
    documentInitializeForRendering(docPtr: number, options?: string): void;
    /**
     * Paint a tile of the document to a buffer
     * @param docPtr Document pointer
     * @param canvasWidth Output width in pixels
     * @param canvasHeight Output height in pixels
     * @param tilePosX X position in twips
     * @param tilePosY Y position in twips
     * @param tileWidth Width in twips
     * @param tileHeight Height in twips
     * @returns RGBA pixel data
     */
    documentPaintTile(docPtr: number, canvasWidth: number, canvasHeight: number, tilePosX: number, tilePosY: number, tileWidth: number, tileHeight: number): Uint8Array;
    /**
     * Get tile mode (0=RGBA, 1=BGRA)
     */
    documentGetTileMode(docPtr: number): number;
    /**
     * Render a page/slide to an image
     * @param docPtr Document pointer
     * @param pageIndex Page/slide index (0-based)
     * @param width Output width in pixels
     * @param height Output height in pixels (0 = auto based on aspect ratio)
     * @returns RGBA pixel data and dimensions
     */
    renderPage(docPtr: number, pageIndex: number, width: number, height?: number, editMode?: boolean): {
        data: Uint8Array;
        width: number;
        height: number;
    };
    /**
     * Render a page/slide at full quality (native resolution based on DPI)
     *
     * Unlike renderPage which scales to a fixed width, this method renders
     * at the document's native resolution converted to pixels at the specified DPI.
     *
     * @param docPtr Document pointer
     * @param pageIndex Page/slide index (0-based)
     * @param dpi Dots per inch for rendering (default 150, use 300 for print quality)
     * @param maxDimension Optional maximum dimension (width or height) to prevent memory issues
     * @returns RGBA pixel data and dimensions
     *
     * @example
     * // Render at 150 DPI (good for screen)
     * const preview = lokBindings.renderPageFullQuality(docPtr, 0, 150);
     *
     * // Render at 300 DPI (print quality)
     * const highRes = lokBindings.renderPageFullQuality(docPtr, 0, 300);
     *
     * // Render with max dimension cap to prevent memory issues
     * const capped = lokBindings.renderPageFullQuality(docPtr, 0, 300, 4096);
     */
    renderPageFullQuality(docPtr: number, pageIndex: number, dpi?: number, maxDimension?: number, editMode?: boolean): {
        data: Uint8Array;
        width: number;
        height: number;
        dpi: number;
    };
    /**
     * Get currently selected text
     * @param docPtr Document pointer
     * @param mimeType Desired MIME type. Must include charset, e.g., 'text/plain;charset=utf-8'
     *                 Note: 'text/plain' without charset is NOT supported by LOK
     * @returns Selected text or null
     */
    getTextSelection(docPtr: number, mimeType?: string): string | null;
    /**
     * Set text selection at coordinates
     * @param docPtr Document pointer
     * @param type Selection type (LOK_SETTEXTSELECTION_START, END, or RESET)
     * @param x X coordinate in twips
     * @param y Y coordinate in twips
     */
    setTextSelection(docPtr: number, type: number, x: number, y: number): void;
    /**
     * Get current selection type
     * @param docPtr Document pointer
     * @returns Selection type (LOK_SELTYPE_NONE, TEXT, or CELL)
     */
    getSelectionType(docPtr: number): number;
    /**
     * Reset/clear current selection
     * @param docPtr Document pointer
     */
    resetSelection(docPtr: number): void;
    /**
     * Post a mouse event to the document
     * @param docPtr Document pointer
     * @param type Event type (LOK_MOUSEEVENT_BUTTONDOWN, BUTTONUP, MOVE)
     * @param x X coordinate in twips
     * @param y Y coordinate in twips
     * @param count Click count (1 for single, 2 for double click)
     * @param buttons Button mask (1=left, 2=middle, 4=right)
     * @param modifier Modifier keys mask
     */
    postMouseEvent(docPtr: number, type: number, x: number, y: number, count?: number, buttons?: number, modifier?: number): void;
    /**
     * Post a keyboard event to the document
     * @param docPtr Document pointer
     * @param type Event type (LOK_KEYEVENT_KEYINPUT, KEYUP)
     * @param charCode Character code
     * @param keyCode Key code
     */
    postKeyEvent(docPtr: number, type: number, charCode: number, keyCode: number): void;
    /**
     * Execute a UNO command
     * @param docPtr Document pointer
     * @param command UNO command (e.g., '.uno:SelectAll', '.uno:Copy')
     * @param args JSON arguments string
     * @param notifyWhenFinished Whether to notify when command completes
     */
    postUnoCommand(docPtr: number, command: string, args?: string, notifyWhenFinished?: boolean): void;
    /**
     * Get command values (query document state)
     * @param docPtr Document pointer
     * @param command Command to query (e.g., '.uno:CharFontName')
     * @returns JSON string with command values
     */
    getCommandValues(docPtr: number, command: string): string | null;
    /**
     * Get bounding rectangles for all pages
     * @param docPtr Document pointer
     * @returns String with rectangles "x,y,width,height;x,y,width,height;..."
     */
    getPartPageRectangles(docPtr: number): string | null;
    /**
     * Get information about a page/slide
     * @param docPtr Document pointer
     * @param part Part index
     * @returns JSON string with part info
     */
    getPartInfo(docPtr: number, part: number): string | null;
    /**
     * Get name of a page/slide
     * @param docPtr Document pointer
     * @param part Part index
     * @returns Part name
     */
    getPartName(docPtr: number, part: number): string | null;
    /**
     * Paste content at current cursor position
     * @param docPtr Document pointer
     * @param mimeType MIME type of data
     * @param data Data to paste
     * @returns true if successful
     */
    paste(docPtr: number, mimeType: string, data: string | Uint8Array): boolean;
    /**
     * Set client zoom level
     * @param docPtr Document pointer
     * @param tilePixelWidth Tile width in pixels
     * @param tilePixelHeight Tile height in pixels
     * @param tileTwipWidth Tile width in twips
     * @param tileTwipHeight Tile height in twips
     */
    setClientZoom(docPtr: number, tilePixelWidth: number, tilePixelHeight: number, tileTwipWidth: number, tileTwipHeight: number): void;
    /**
     * Set visible area for the client
     * @param docPtr Document pointer
     * @param x X position in twips
     * @param y Y position in twips
     * @param width Width in twips
     * @param height Height in twips
     */
    setClientVisibleArea(docPtr: number, x: number, y: number, width: number, height: number): void;
    /**
     * Get the currently focused paragraph text
     * @param docPtr Document pointer
     * @returns Focused paragraph text
     */
    getA11yFocusedParagraph(docPtr: number): string | null;
    /**
     * Get caret position in focused paragraph
     * @param docPtr Document pointer
     * @returns Caret position or -1
     */
    getA11yCaretPosition(docPtr: number): number;
    /**
     * Enable/disable accessibility features
     * @param docPtr Document pointer
     * @param viewId View ID
     * @param enabled Whether to enable accessibility
     */
    setAccessibilityState(docPtr: number, viewId: number, enabled: boolean): void;
    /**
     * Get data area for a spreadsheet (last used row/column)
     * @param docPtr Document pointer
     * @param part Sheet index
     * @returns Object with col and row counts
     */
    getDataArea(docPtr: number, part: number): {
        col: number;
        row: number;
    };
    /**
     * Get current edit mode
     * @param docPtr Document pointer
     * @returns Edit mode value
     */
    getEditMode(docPtr: number): number;
    /**
     * Set edit mode for the document
     * @param docPtr Document pointer
     * @param mode 0 for view mode, 1 for edit mode
     */
    setEditMode(docPtr: number, mode: number): void;
    /**
     * Create a new view for the document
     * @param docPtr Document pointer
     * @returns View ID
     */
    createView(docPtr: number): number;
    /**
     * Create a new view with options
     * @param docPtr Document pointer
     * @param options Options string (JSON)
     * @returns View ID
     */
    createViewWithOptions(docPtr: number, options: string): number;
    /**
     * Destroy a view
     * @param docPtr Document pointer
     * @param viewId View ID to destroy
     */
    destroyView(docPtr: number, viewId: number): void;
    /**
     * Set the current active view
     * @param docPtr Document pointer
     * @param viewId View ID to make active
     */
    setView(docPtr: number, viewId: number): void;
    /**
     * Get the current active view ID
     * @param docPtr Document pointer
     * @returns Current view ID
     */
    getView(docPtr: number): number;
    /**
     * Get the number of views
     * @param docPtr Document pointer
     * @returns Number of views
     */
    getViewsCount(docPtr: number): number;
    /**
     * Enable synchronous event dispatch (Unipoll mode).
     * This must be called before using postKeyEvent, postMouseEvent, etc.
     * to ensure events are processed immediately instead of being queued.
     *
     * Without this, events posted via postKeyEvent/postMouseEvent are queued
     * via Application::PostUserEvent() and never processed in headless mode.
     */
    enableSyncEvents(): void;
    /**
     * Disable synchronous event dispatch.
     * Call this when done with event-based operations.
     */
    disableSyncEvents(): void;
    /**
     * Register a callback handler for the document.
     * Events are queued and can be retrieved via pollCallback().
     * @param docPtr Document pointer
     */
    registerCallback(docPtr: number): void;
    /**
     * Unregister the callback handler for the document.
     * @param docPtr Document pointer
     */
    unregisterCallback(docPtr: number): void;
    /**
     * Check if there are any pending callback events.
     * @returns true if events are pending
     */
    hasCallbackEvents(): boolean;
    /**
     * Get the number of pending callback events.
     * @returns Number of events in the queue
     */
    getCallbackEventCount(): number;
    /**
     * Poll and retrieve the next callback event from the queue.
     * @returns The next event, or null if queue is empty
     */
    pollCallback(): LOKCallbackEvent | null;
    /**
     * Poll all pending callback events.
     * @returns Array of all pending events
     */
    pollAllCallbacks(): LOKCallbackEvent[];
    /**
     * Clear all pending callback events.
     */
    clearCallbackQueue(): void;
    /**
     * Force flush pending LOK callbacks for a document.
     * This is needed in WASM because callbacks are queued via PostUserEvent
     * but the event loop doesn't run automatically.
     * Call this after operations that trigger callbacks (e.g., postUnoCommand)
     * to ensure the callback queue is populated.
     * @param docPtr Document pointer
     */
    flushCallbacks(docPtr: number): void;
    /**
     * Poll for STATE_CHANGED callbacks and parse them into a map.
     * STATE_CHANGED payloads are in format: ".uno:CommandName=value"
     * @returns Map of command names to values
     */
    pollStateChanges(): Map<string, string>;
    /**
     * Click at a position and get text at that location
     * @param docPtr Document pointer
     * @param x X coordinate in twips
     * @param y Y coordinate in twips
     * @returns Text at the clicked position
     */
    clickAndGetText(docPtr: number, x: number, y: number): string | null;
    /**
     * Double-click to select a word and get it
     * @param docPtr Document pointer
     * @param x X coordinate in twips
     * @param y Y coordinate in twips
     * @returns Selected word
     */
    doubleClickAndGetWord(docPtr: number, x: number, y: number): string | null;
    /**
     * Select all content in the document
     * @param docPtr Document pointer
     */
    selectAll(docPtr: number): void;
    /**
     * Get all text content from the document
     * @param docPtr Document pointer
     * @returns All text content
     */
    getAllText(docPtr: number): string | null;
    /**
     * Parse page rectangles string into array of objects
     * @param rectanglesStr String from getPartPageRectangles
     * @returns Array of rectangle objects
     */
    parsePageRectangles(rectanglesStr: string): Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
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
 * Abstract base class for all document editors
 */
declare abstract class OfficeEditor {
    protected lok: LOKBindings;
    protected docPtr: number;
    protected options: Required<Pick<OpenDocumentOptions, 'maxResponseChars'>> & OpenDocumentOptions;
    protected inputPath: string;
    constructor(lok: LOKBindings, docPtr: number, options?: OpenDocumentOptions);
    abstract getStructure(options?: {
        maxResponseChars?: number;
    }): OperationResult<DocumentStructure>;
    abstract getDocumentType(): 'writer' | 'calc' | 'impress' | 'draw';
    /**
     * Get the document pointer for low-level LOK operations
     */
    getDocPtr(): number;
    /**
     * Get the LOK bindings for low-level operations
     */
    getLokBindings(): LOKBindings;
    save(): OperationResult<{
        path: string;
    }>;
    saveAs(path: string, format: OutputFormat): OperationResult<{
        path: string;
    }>;
    close(): OperationResult<void>;
    /**
     * Get the current edit mode of the document
     * @returns 0 = view mode, 1 = edit mode
     */
    getEditMode(): number;
    /**
     * Attempt to enable edit mode for the document
     * @returns OperationResult with success and verified fields
     */
    enableEditMode(): OperationResult<{
        editMode: number;
    }>;
    undo(): OperationResult<void>;
    redo(): OperationResult<void>;
    find(text: string, options?: FindOptions): OperationResult<{
        matches: number;
        firstMatch?: Position;
    }>;
    findAndReplaceAll(find: string, replace: string, options?: FindOptions): OperationResult<{
        replacements: number;
    }>;
    /**
     * Poll all STATE_CHANGED callback events and return as a map.
     *
     * LOK sends STATE_CHANGED events when formatting state changes (e.g., when
     * the cursor moves over bold text, `.uno:Bold=true` is emitted).
     *
     * Pattern for getting current format state:
     * 1. clearCallbackQueue() - clear any stale events
     * 2. Perform action that triggers state change (e.g., SelectWord)
     * 3. flushCallbacks(docPtr) - force LOK to process callbacks
     * 4. pollStateChanges() - retrieve the events
     *
     * @returns Map of UNO command names to their state values
     *          e.g., Map { '.uno:Bold' => 'true', '.uno:Italic' => 'false' }
     */
    getStateChanges(): OperationResult<Map<string, string>>;
    /**
     * Flush pending LOK callbacks and then poll for state changes.
     * Convenience method that combines flushCallbacks + pollStateChanges.
     *
     * @returns Map of UNO command names to their state values
     */
    flushAndPollState(): OperationResult<Map<string, string>>;
    /**
     * Clear the callback queue, useful before performing operations
     * where you want to capture only new state changes.
     */
    clearCallbackQueue(): void;
    select(_selection: SelectionRange): OperationResult<{
        selected: string;
    }>;
    getSelection(): OperationResult<{
        text: string;
        range: SelectionRange;
    }>;
    clearSelection(): OperationResult<void>;
    protected createResult<T>(data: T): OperationResult<T>;
    protected createErrorResult<T>(error: string, suggestion?: string): OperationResult<T>;
    protected createResultWithTruncation<T>(data: T, truncation?: TruncationInfo): OperationResult<T>;
    protected truncateContent(content: string, maxChars?: number): {
        content: string;
        truncated: boolean;
        original: number;
        returned: number;
    };
    protected truncateArray<T>(items: T[], maxChars: number, itemToString: (item: T) => string): {
        items: T[];
        truncated: boolean;
        original: number;
        returned: number;
    };
    protected a1ToRowCol(a1: string): {
        row: number;
        col: number;
    };
    protected rowColToA1(row: number, col: number): string;
    protected normalizeCellRef(ref: CellRef): {
        row: number;
        col: number;
    };
    setInputPath(path: string): void;
    isOpen(): boolean;
}

/**
 * Editor for Writer (text) documents
 */
declare class WriterEditor extends OfficeEditor {
    private cachedParagraphs;
    getDocumentType(): 'writer';
    getStructure(options?: {
        maxResponseChars?: number;
    }): OperationResult<WriterStructure>;
    getParagraph(index: number): OperationResult<Paragraph>;
    getParagraphs(start: number, count: number): OperationResult<Paragraph[]>;
    insertParagraph(text: string, options?: {
        afterIndex?: number;
        style?: 'Normal' | 'Heading 1' | 'Heading 2' | 'Heading 3' | 'List';
    }): OperationResult<{
        index: number;
    }>;
    replaceParagraph(index: number, text: string): OperationResult<{
        oldText: string;
    }>;
    deleteParagraph(index: number): OperationResult<{
        deletedText: string;
    }>;
    insertText(text: string, _position: TextPosition): OperationResult<void>;
    deleteText(_start: TextPosition, _end: TextPosition): OperationResult<{
        deleted: string;
    }>;
    replaceText(find: string, replace: string, options?: {
        paragraph?: number;
        all?: boolean;
    }): OperationResult<{
        replacements: number;
    }>;
    formatText(_range: TextRange, format: TextFormat): OperationResult<void>;
    /**
     * Get the text formatting at the current selection or cursor position.
     *
     * Uses LOK callback mechanism to retrieve STATE_CHANGED events which contain
     * formatting state like `.uno:Bold=true`, `.uno:Italic=false`, etc.
     *
     * @param _position - Text position (currently unused, uses current selection)
     * @returns TextFormat with bold, italic, underline, fontSize, fontName properties
     */
    getFormat(_position?: TextPosition): OperationResult<TextFormat>;
    /**
     * Get formatting state for the current selection using the callback mechanism.
     * This is the preferred way to get character formatting as it uses LOK's
     * STATE_CHANGED callback events.
     *
     * @returns Map of UNO command names to their state values
     */
    getSelectionFormat(): OperationResult<Map<string, string>>;
    private getParagraphsInternal;
}

/**
 * Editor for Calc (spreadsheet) documents
 */
declare class CalcEditor extends OfficeEditor {
    getDocumentType(): 'calc';
    getStructure(_options?: {
        maxResponseChars?: number;
    }): OperationResult<CalcStructure>;
    getSheetNames(): OperationResult<string[]>;
    getCell(cell: CellRef, sheet?: SheetRef): OperationResult<CellData>;
    getCells(range: RangeRef, sheet?: SheetRef, options?: {
        maxResponseChars?: number;
    }): OperationResult<CellData[][]>;
    setCellValue(cell: CellRef, value: string | number, sheet?: SheetRef): OperationResult<{
        oldValue: CellValue;
        newValue: CellValue;
    }>;
    setCellFormula(cell: CellRef, formula: string, sheet?: SheetRef): OperationResult<{
        calculatedValue: CellValue;
    }>;
    setCells(range: RangeRef, values: CellValue[][], sheet?: SheetRef): OperationResult<{
        cellsUpdated: number;
    }>;
    clearCell(cell: CellRef, sheet?: SheetRef): OperationResult<{
        oldValue: CellValue;
    }>;
    clearRange(range: RangeRef, sheet?: SheetRef): OperationResult<{
        cellsCleared: number;
    }>;
    insertRow(afterRow: number, sheet?: SheetRef): OperationResult<void>;
    insertColumn(afterCol: ColRef, sheet?: SheetRef): OperationResult<void>;
    deleteRow(row: number, sheet?: SheetRef): OperationResult<void>;
    deleteColumn(col: ColRef, sheet?: SheetRef): OperationResult<void>;
    formatCells(range: RangeRef, format: CellFormat, sheet?: SheetRef): OperationResult<void>;
    addSheet(name: string): OperationResult<{
        index: number;
    }>;
    renameSheet(sheet: SheetRef, newName: string): OperationResult<void>;
    deleteSheet(sheet: SheetRef): OperationResult<void>;
    private selectSheet;
    private getSheetIndexByName;
    private goToCell;
    private getCellValueInternal;
    private getCellFormulaInternal;
    private normalizeRangeRef;
    private normalizeRangeToString;
    private hexToNumber;
}

/**
 * Editor for Impress (presentation) documents
 */
declare class ImpressEditor extends OfficeEditor {
    getDocumentType(): 'impress';
    getStructure(_options?: {
        maxResponseChars?: number;
    }): OperationResult<ImpressStructure>;
    getSlide(index: number): OperationResult<SlideData>;
    getSlideCount(): OperationResult<number>;
    addSlide(options?: {
        afterSlide?: number;
        layout?: SlideLayout;
    }): OperationResult<{
        index: number;
    }>;
    deleteSlide(index: number): OperationResult<void>;
    duplicateSlide(index: number): OperationResult<{
        newIndex: number;
    }>;
    moveSlide(fromIndex: number, toIndex: number): OperationResult<void>;
    setSlideTitle(index: number, title: string): OperationResult<{
        oldTitle?: string;
    }>;
    setSlideBody(index: number, body: string): OperationResult<{
        oldBody?: string;
    }>;
    setSlideNotes(index: number, notes: string): OperationResult<void>;
    setSlideLayout(index: number, layout: SlideLayout): OperationResult<void>;
    private getSlideInfoInternal;
    private parseTextFrames;
    private detectLayout;
    private applySlideLayout;
}

/**
 * Editor for Draw (vector graphics) documents
 * Also handles imported PDFs opened for editing
 */
declare class DrawEditor extends OfficeEditor {
    private isImportedPdf;
    getDocumentType(): 'draw';
    setImportedPdf(value: boolean): void;
    getStructure(_options?: {
        maxResponseChars?: number;
    }): OperationResult<DrawStructure>;
    getPage(index: number): OperationResult<PageData>;
    getPageCount(): OperationResult<number>;
    addPage(options?: {
        afterPage?: number;
    }): OperationResult<{
        index: number;
    }>;
    deletePage(index: number): OperationResult<void>;
    duplicatePage(index: number): OperationResult<{
        newIndex: number;
    }>;
    addShape(pageIndex: number, shapeType: ShapeType, bounds: Rectangle, options?: {
        text?: string;
        fillColor?: string;
        lineColor?: string;
    }): OperationResult<{
        shapeIndex: number;
    }>;
    addLine(pageIndex: number, start: Position, end: Position, options?: {
        lineColor?: string;
        lineWidth?: number;
    }): OperationResult<{
        shapeIndex: number;
    }>;
    deleteShape(pageIndex: number, shapeIndex: number): OperationResult<void>;
    setShapeText(pageIndex: number, shapeIndex: number, text: string): OperationResult<void>;
    moveShape(pageIndex: number, shapeIndex: number, newPosition: Position): OperationResult<void>;
    resizeShape(pageIndex: number, shapeIndex: number, newSize: Size): OperationResult<void>;
    private getPageInfoInternal;
    private getShapesOnPage;
    private selectShape;
    private getShapeCommand;
    private hexToNumber;
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
                pdf: "pdf";
                docx: "docx";
                doc: "doc";
                odt: "odt";
                rtf: "rtf";
                txt: "txt";
                html: "html";
                xlsx: "xlsx";
                xls: "xls";
                ods: "ods";
                csv: "csv";
                pptx: "pptx";
                ppt: "ppt";
                odp: "odp";
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
                pdf: "pdf";
                docx: "docx";
                doc: "doc";
                odt: "odt";
                rtf: "rtf";
                txt: "txt";
                html: "html";
                xlsx: "xlsx";
                xls: "xls";
                ods: "ods";
                csv: "csv";
                pptx: "pptx";
                ppt: "ppt";
                odp: "odp";
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
 * All available tools organized by document type
 */
declare const allTools: {
    readonly common: {
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
                    pdf: "pdf";
                    docx: "docx";
                    doc: "doc";
                    odt: "odt";
                    rtf: "rtf";
                    txt: "txt";
                    html: "html";
                    xlsx: "xlsx";
                    xls: "xls";
                    ods: "ods";
                    csv: "csv";
                    pptx: "pptx";
                    ppt: "ppt";
                    odp: "odp";
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
    readonly writer: {
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
    readonly calc: {
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
    readonly impress: {
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
    readonly draw: {
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
    readonly document: {
        readonly convertDocument: {
            readonly name: "convertDocument";
            readonly description: "Convert the entire document to a different format. Returns the converted document as binary data. Use this for format conversions like DOCX to PDF, XLSX to CSV, PPTX to PDF, etc.";
            readonly parameters: z.ZodObject<{
                outputFormat: z.ZodEnum<{
                    png: "png";
                    jpg: "jpg";
                    svg: "svg";
                    pdf: "pdf";
                    docx: "docx";
                    doc: "doc";
                    odt: "odt";
                    rtf: "rtf";
                    txt: "txt";
                    html: "html";
                    xlsx: "xlsx";
                    xls: "xls";
                    ods: "ods";
                    csv: "csv";
                    pptx: "pptx";
                    ppt: "ppt";
                    odp: "odp";
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
                pdf: "pdf";
                docx: "docx";
                doc: "doc";
                odt: "odt";
                rtf: "rtf";
                txt: "txt";
                html: "html";
                xlsx: "xlsx";
                xls: "xls";
                ods: "ods";
                csv: "csv";
                pptx: "pptx";
                ppt: "ppt";
                odp: "odp";
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
                pdf: "pdf";
                docx: "docx";
                doc: "doc";
                odt: "odt";
                rtf: "rtf";
                txt: "txt";
                html: "html";
                xlsx: "xlsx";
                xls: "xls";
                ods: "ods";
                csv: "csv";
                pptx: "pptx";
                ppt: "ppt";
                odp: "odp";
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
/**
 * Get tools available for a specific document type
 */
declare function getToolsForDocumentType(docType: 'writer' | 'calc' | 'impress' | 'draw'): ToolDefinition[];
/**
 * Convert a tool definition to OpenAI-compatible function schema
 */
declare function toOpenAIFunction(tool: ToolDefinition): {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
};
/**
 * Convert a tool definition to Anthropic-compatible tool schema
 */
declare function toAnthropicTool(tool: ToolDefinition): {
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
};
/**
 * Get all tools as OpenAI function definitions for a document type
 */
declare function getOpenAIFunctions(docType: 'writer' | 'calc' | 'impress' | 'draw'): {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}[];
/**
 * Get all tools as Anthropic tool definitions for a document type
 */
declare function getAnthropicTools(docType: 'writer' | 'calc' | 'impress' | 'draw'): {
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
}[];
type CommonToolName = keyof typeof commonTools;
type WriterToolName = keyof typeof writerTools;
type CalcToolName = keyof typeof calcTools;
type ImpressToolName = keyof typeof impressTools;
type DrawToolName = keyof typeof drawTools;
type DocumentToolName = keyof typeof documentTools;
type AllToolName = CommonToolName | WriterToolName | CalcToolName | ImpressToolName | DrawToolName | DocumentToolName;
type ToolParameters<T extends AllToolName> = z.infer<(typeof toolsByName)[T]['parameters']>;

/**
 * Factory function to create the appropriate editor based on document type
 *
 * @param lok - LibreOfficeKit bindings instance
 * @param docPtr - Document pointer from lok.documentLoad()
 * @param options - Editor options (maxResponseChars, etc.)
 * @returns Typed editor instance (WriterEditor, CalcEditor, ImpressEditor, or DrawEditor)
 * @throws Error if document type is unsupported
 *
 * @example
 * ```typescript
 * const docPtr = lok.documentLoad('/tmp/document.docx');
 * const editor = createEditor(lok, docPtr);
 *
 * if (isWriterEditor(editor)) {
 *   // TypeScript knows editor has WriterEditor methods
 *   const result = editor.insertParagraph('Hello World');
 * }
 * ```
 */
declare function createEditor(lok: LOKBindings, docPtr: number, options?: OpenDocumentOptions): OfficeEditor;
/**
 * Type guard for WriterEditor
 */
declare function isWriterEditor(editor: OfficeEditor): editor is WriterEditor;
/**
 * Type guard for CalcEditor
 */
declare function isCalcEditor(editor: OfficeEditor): editor is CalcEditor;
/**
 * Type guard for ImpressEditor
 */
declare function isImpressEditor(editor: OfficeEditor): editor is ImpressEditor;
/**
 * Type guard for DrawEditor
 */
declare function isDrawEditor(editor: OfficeEditor): editor is DrawEditor;

export { LOK_DOCTYPE_OTHER as $, type WasmLoadPhase as A, type WasmLoadProgress as B, type ConversionOptions as C, DEFAULT_WASM_BASE_URL as D, EXTENSION_TO_FORMAT as E, FORMAT_FILTERS as F, LOK_MOUSEEVENT_BUTTONDOWN as G, LOK_MOUSEEVENT_BUTTONUP as H, type ImageOptions as I, LOK_MOUSEEVENT_MOVE as J, LOK_KEYEVENT_KEYINPUT as K, type LibreOfficeWasmOptions as L, LOK_KEYEVENT_KEYUP as M, LOK_SELTYPE_NONE as N, type OutputFormat as O, type PdfOptions as P, LOK_SELTYPE_TEXT as Q, LOK_SELTYPE_CELL as R, SubprocessConverter as S, LOK_SETTEXTSELECTION_START as T, LOK_SETTEXTSELECTION_END as U, LOK_SETTEXTSELECTION_RESET as V, WorkerConverter as W, LOK_DOCTYPE_TEXT as X, LOK_DOCTYPE_SPREADSHEET as Y, LOK_DOCTYPE_PRESENTATION as Z, LOK_DOCTYPE_DRAWING as _, LibreOfficeConverter as a, type DrawToolName as a$, createEditor as a0, isWriterEditor as a1, isCalcEditor as a2, isImpressEditor as a3, isDrawEditor as a4, OfficeEditor as a5, WriterEditor as a6, CalcEditor as a7, ImpressEditor as a8, DrawEditor as a9, type CellData as aA, type CellFormat as aB, type SheetInfo as aC, type CalcStructure as aD, type SlideLayout as aE, type TextFrame as aF, type SlideData as aG, type SlideInfo as aH, type ImpressStructure as aI, type ShapeType as aJ, type ShapeData as aK, type PageData as aL, type PageInfo as aM, type DrawStructure as aN, type Rectangle as aO, type Size as aP, type Position as aQ, type DocumentMetadata as aR, type DocumentStructure as aS, type DocumentType as aT, type SelectionRange as aU, type FindOptions as aV, type ToolDefinition as aW, type CommonToolName as aX, type WriterToolName as aY, type CalcToolName as aZ, type ImpressToolName as a_, allTools as aa, toolsByName as ab, commonTools as ac, writerTools as ad, calcTools as ae, impressTools as af, drawTools as ag, documentTools as ah, getToolsForDocumentType as ai, toOpenAIFunction as aj, toAnthropicTool as ak, getOpenAIFunctions as al, getAnthropicTools as am, type OperationResult as an, type TruncationInfo as ao, type OpenDocumentOptions as ap, type TextPosition as aq, type TextRange as ar, type TextFormat as as, type Paragraph as at, type WriterStructure as au, type CellRef as av, type RangeRef as aw, type ColRef as ax, type SheetRef as ay, type CellValue as az, type ConversionResult as b, type DocumentToolName as b0, type AllToolName as b1, type ToolParameters as b2, type ILibreOfficeConverter as b3, type InputFormatOptions as b4, type PagePreview as b5, type FullQualityPagePreview as b6, type RenderOptions as b7, type FullQualityRenderOptions as b8, type DocumentInfo as b9, type EditorSession as ba, type EditorOperationResult as bb, type EmscriptenModule as bc, type EmscriptenFS as bd, type WasmLoaderModule as be, createWorkerConverter as c, createSubprocessConverter as d, encodeImage as e, rgbaToJpeg as f, rgbaToWebp as g, getSharp as h, isSharpAvailable as i, type ImageEncodeOptions as j, type InputFormat as k, type ProgressInfo as l, ConversionError as m, ConversionErrorCode as n, FORMAT_MIME_TYPES as o, getValidOutputFormats as p, isConversionValid as q, rgbaToPng as r, getConversionErrorMessage as s, INPUT_FORMAT_CATEGORY as t, CATEGORY_OUTPUT_FORMATS as u, LOKDocumentType as v, LOK_DOCTYPE_OUTPUT_FORMATS as w, getOutputFormatsForDocType as x, createWasmPaths as y, type DocumentCategory as z };
