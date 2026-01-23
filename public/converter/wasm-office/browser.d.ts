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

/**
 * LibreOffice WASM Document Converter - Browser Module
 *
 * Browser-optimized module with utilities for file handling,
 * drag-and-drop, and downloads.
 *
 * @packageDocumentation
 */

/**
 * Browser-only LibreOffice WASM Converter
 *
 * Note: This class has a different API than ILibreOfficeConverter because it runs
 * on the main thread and can return editor objects directly. Use WorkerBrowserConverter
 * for the standard session-based API.
 */
declare class BrowserConverter {
    private module;
    private _lokInstance;
    private lokBindings;
    private initialized;
    private initializing;
    private options;
    constructor(options?: BrowserConverterOptions);
    /**
     * Initialize the LibreOffice WASM module
     */
    initialize(): Promise<void>;
    private loadModule;
    private setupFileSystem;
    private initLOK;
    /**
     * Convert a document
     */
    convert(input: Uint8Array | ArrayBuffer, options: ConversionOptions, filename?: string): Promise<ConversionResult>;
    /**
     * Open a document for editing without converting
     * Returns an editor instance for the document type (WriterEditor, CalcEditor, etc.)
     *
     * @example
     * ```typescript
     * const editor = await converter.openDocument(fileData, 'document.docx');
     * if (isWriterEditor(editor)) {
     *   const structure = editor.getStructure();
     *   editor.insertParagraph('Hello World');
     *   await editor.saveAs('/tmp/output.docx', 'docx');
     * }
     * editor.close();
     * ```
     */
    openDocument(input: Uint8Array | ArrayBuffer, filename: string, options?: OpenDocumentOptions): Promise<OfficeEditor>;
    /**
     * Get the LOK bindings for low-level operations
     * Useful for accessing methods not exposed through the editor API
     */
    getLokBindings(): LOKBindings;
    /**
     * Convert a File object
     */
    convertFile(file: File, options: ConversionOptions): Promise<ConversionResult>;
    /**
     * Convert from a URL
     */
    convertFromUrl(url: string, options: ConversionOptions): Promise<ConversionResult>;
    /**
     * Download converted document
     */
    download(result: ConversionResult, filename?: string): void;
    /**
     * Create Blob URL
     */
    createBlobUrl(result: ConversionResult): string;
    /**
     * Preview in new tab
     */
    preview(result: ConversionResult): Window | null;
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
    isReady(): boolean;
    static getSupportedOutputFormats(): OutputFormat[];
    private getExt;
    private emitProgress;
}
/**
 * Worker-based LibreOffice WASM Converter
 *
 * Runs WASM module in a Web Worker to avoid blocking the main thread.
 * Implements ILibreOfficeConverter for consistent API across platforms.
 */
declare class WorkerBrowserConverter implements ILibreOfficeConverter {
    private worker;
    private initialized;
    private initializing;
    private messageId;
    private pendingRequests;
    private options;
    constructor(options?: WorkerBrowserConverterOptions);
    /**
     * Initialize the worker and LibreOffice WASM module
     */
    initialize(): Promise<void>;
    private handleWorkerMessage;
    private sendMessage;
    /**
     * Convert a document
     */
    convert(input: Uint8Array | ArrayBuffer, options: ConversionOptions, filename?: string): Promise<ConversionResult>;
    /**
     * Convert a File object
     */
    convertFile(file: File, options: ConversionOptions): Promise<ConversionResult>;
    /**
     * Convert from a URL
     */
    convertFromUrl(url: string, options: ConversionOptions): Promise<ConversionResult>;
    /**
     * Download converted document
     */
    download(result: ConversionResult, filename?: string): void;
    /**
     * Create Blob URL
     */
    createBlobUrl(result: ConversionResult): string;
    /**
     * Preview in new tab
     */
    preview(result: ConversionResult): Window | null;
    /**
     * Get the number of pages/slides in a document
     */
    getPageCount(input: Uint8Array | ArrayBuffer, options: Pick<ConversionOptions, 'inputFormat'>): Promise<number>;
    /**
     * Render page previews as RGBA image data
     * @param input Document data
     * @param options Must include inputFormat
     * @param maxWidth Maximum width for rendered pages (height scales proportionally)
     * @returns Array of page previews with RGBA data
     */
    renderPreviews(input: Uint8Array | ArrayBuffer, options: Pick<ConversionOptions, 'inputFormat'>, maxWidth?: number): Promise<Array<{
        page: number;
        data: Uint8Array;
        width: number;
        height: number;
    }>>;
    /**
     * Render a single page preview - useful for lazy loading pages one at a time
     * @param input Document data
     * @param options Must include inputFormat
     * @param pageIndex Zero-based page index to render
     * @param maxWidth Maximum width for rendered page (height scales proportionally)
     * @returns Single page preview with RGBA data
     */
    renderSinglePage(input: Uint8Array | ArrayBuffer, options: Pick<ConversionOptions, 'inputFormat'>, pageIndex: number, maxWidth?: number): Promise<{
        page: number;
        data: Uint8Array;
        width: number;
        height: number;
    }>;
    /**
     * Render a single page preview using conversion (PDF->PNG)
     * This is a fallback for Chrome/Edge where paintTile hangs for Drawing documents
     * @param input Document data
     * @param options Must include inputFormat
     * @param pageIndex Zero-based page index to render
     * @param maxWidth Maximum width for rendered page
     * @returns Single page preview with PNG data (not RGBA)
     */
    renderPageViaConvert(input: Uint8Array | ArrayBuffer, options: Pick<ConversionOptions, 'inputFormat'>, pageIndex: number, maxWidth?: number): Promise<{
        page: number;
        data: Uint8Array;
        width: number;
        height: number;
        isPng: boolean;
    }>;
    /**
     * Get document info including type and valid output formats
     * This dynamically queries LibreOffice to determine what conversions are supported
     * @param input Document data
     * @param options Must include inputFormat
     * @returns Document info with type, name, valid outputs, and page count
     */
    getDocumentInfo(input: Uint8Array | ArrayBuffer, options: InputFormatOptions): Promise<DocumentInfo>;
    /**
     * Get low-level LOK information about a document
     * Includes bounding boxes, text content, positions, and edit mode
     * @param input Document data
     * @param options Must include inputFormat
     * @returns LOK info with rectangles, sizes, text, and positions
     */
    getLokInfo(input: Uint8Array | ArrayBuffer, options: Pick<ConversionOptions, 'inputFormat'>): Promise<{
        pageRectangles: string | null;
        documentSize: {
            width: number;
            height: number;
        };
        partInfo: {
            visible: string;
            selected: string;
            masterPageCount?: string;
            mode: string;
        } | null;
        a11yFocusedParagraph: {
            content: string;
            position: string;
            start: string;
            end: string;
        } | null;
        a11yCaretPosition: number;
        editMode: number;
        allText: string | null;
    }>;
    /**
     * Render all page rectangles as individual screenshots
     * Returns each page's bounding box (in twips) with rendered RGBA image data
     * @param input Document data
     * @param options Must include inputFormat
     * @param maxWidth Maximum width for rendered pages (height scales proportionally)
     * @returns Array of page rectangles with their rendered images
     */
    renderPageRectangles(input: Uint8Array | ArrayBuffer, options: Pick<ConversionOptions, 'inputFormat'>, maxWidth?: number): Promise<Array<{
        index: number;
        x: number;
        y: number;
        width: number;
        height: number;
        imageData: Uint8Array;
        imageWidth: number;
        imageHeight: number;
    }>>;
    /**
     * Edit text in a document - find/replace or insert text
     * @param input Document data
     * @param options Must include inputFormat
     * @param editOptions Either findText+replaceText or insertText
     * @returns Edit result with success status and optionally the modified document
     */
    editText(input: Uint8Array | ArrayBuffer, options: Pick<ConversionOptions, 'inputFormat'>, editOptions: {
        findText?: string;
        replaceText?: string;
        insertText?: string;
    }): Promise<{
        success: boolean;
        editMode: number;
        message: string;
        modifiedDocument?: Uint8Array;
    }>;
    /**
     * Test various LOK operations on a document
     * Tests: SelectAll, getTextSelection, getSelectionType, resetSelection,
     *        Delete, Undo, Redo, Bold, Italic, setTextSelection, save
     * @param input Document data
     * @param options Must include inputFormat
     * @returns Test results for each operation
     */
    testLokOperations(input: Uint8Array | ArrayBuffer, options: Pick<ConversionOptions, 'inputFormat'>): Promise<{
        operations: Array<{
            operation: string;
            success: boolean;
            result?: unknown;
            error?: string;
        }>;
        summary: string;
    }>;
    /**
     * Open a document for editing and return a proxy editor
     *
     * @param input Document data as Uint8Array or ArrayBuffer
     * @param options Must include inputFormat
     * @returns BrowserEditorProxy for interacting with the document
     *
     * @example
     * ```typescript
     * const editor = await converter.openDocument(docxData, { inputFormat: 'docx' });
     * console.log(editor.documentType); // 'writer'
     *
     * // Get formatting at cursor
     * const format = await editor.getFormat();
     * console.log(format); // { bold: true, italic: false, ... }
     *
     * // Apply formatting
     * await editor.selectAll();
     * await editor.formatText({ bold: true });
     *
     * // Save and close
     * const savedDoc = await editor.save();
     * await editor.close();
     * ```
     */
    openDocument(input: Uint8Array | ArrayBuffer, options: InputFormatOptions): Promise<EditorSession>;
    /**
     * Internal method to send editor operation to worker
     * @internal
     */
    _sendEditorOperation(sessionId: string, method: string, args?: unknown[]): Promise<{
        success: boolean;
        verified?: boolean;
        data?: unknown;
        error?: string;
        suggestion?: string;
    }>;
    /**
     * Internal method to close an editor session
     * @internal
     */
    _closeDocument(sessionId: string): Promise<Uint8Array | undefined>;
    /**
     * Render a single page as an image (ILibreOfficeConverter interface)
     * @param input Document data
     * @param options Must include inputFormat
     * @param pageIndex Zero-based page index to render
     * @param width Target width for rendered page
     * @param height Optional target height (scales proportionally if not provided)
     * @returns Page preview with RGBA data
     */
    renderPage(input: Uint8Array | ArrayBuffer, options: InputFormatOptions, pageIndex: number, width: number, height?: number): Promise<PagePreview>;
    /**
     * Render multiple pages as images (ILibreOfficeConverter interface)
     * @param input Document data
     * @param options Must include inputFormat
     * @param renderOptions Optional render settings (maxWidth, pages)
     * @returns Array of page previews with RGBA data
     */
    renderPagePreviews(input: Uint8Array | ArrayBuffer, options: InputFormatOptions, renderOptions?: RenderOptions): Promise<PagePreview[]>;
    /**
     * Render a page at full quality (native resolution based on DPI)
     * @param input Document data
     * @param options Must include inputFormat
     * @param pageIndex Zero-based page index to render
     * @param renderOptions DPI and max dimension settings
     * @returns Full quality page preview with RGBA data and DPI info
     */
    renderPageFullQuality(input: Uint8Array | ArrayBuffer, options: InputFormatOptions, pageIndex: number, renderOptions?: FullQualityRenderOptions): Promise<FullQualityPagePreview>;
    /**
     * Execute an editor operation on an open document (ILibreOfficeConverter interface)
     * @param sessionId The editor session ID
     * @param method The editor method to call
     * @param args Arguments to pass to the method
     * @returns Operation result
     */
    editorOperation<T = unknown>(sessionId: string, method: string, args?: unknown[]): Promise<EditorOperationResult<T>>;
    /**
     * Close an editor session and optionally get the modified document (ILibreOfficeConverter interface)
     * @param sessionId The editor session ID
     * @returns The modified document data, or undefined if no changes
     */
    closeDocument(sessionId: string): Promise<Uint8Array | undefined>;
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
    isReady(): boolean;
    static getSupportedOutputFormats(): OutputFormat[];
    private getExt;
    private emitProgress;
}
/**
 * Proxy class for editing documents in the browser via Web Worker
 *
 * This class provides a clean API that mirrors the server-side editor classes
 * but communicates through the worker message protocol.
 */
declare class BrowserEditorProxy implements EditorSession {
    private converter;
    private _sessionId;
    private _documentType;
    private _pageCount;
    private _closed;
    constructor(converter: WorkerBrowserConverter, sessionId: string, documentType: 'writer' | 'calc' | 'impress' | 'draw', pageCount: number);
    /** Get the session ID */
    get sessionId(): string;
    /** Get the document type (writer, calc, impress, draw) */
    get documentType(): 'writer' | 'calc' | 'impress' | 'draw';
    /** Get the page count */
    get pageCount(): number;
    /** Check if the document is still open */
    get isOpen(): boolean;
    /** Get document structure */
    getStructure(): Promise<EditorOperationResult>;
    /** Undo last operation */
    undo(): Promise<EditorOperationResult>;
    /** Redo last undone operation */
    redo(): Promise<EditorOperationResult>;
    /** Find text in document */
    find(text: string, options?: {
        caseSensitive?: boolean;
        wholeWord?: boolean;
    }): Promise<EditorOperationResult>;
    /** Find and replace all occurrences */
    findAndReplaceAll(find: string, replace: string, options?: {
        caseSensitive?: boolean;
        wholeWord?: boolean;
    }): Promise<EditorOperationResult>;
    /** Get current selection */
    getSelection(): Promise<EditorOperationResult>;
    /** Clear current selection */
    clearSelection(): Promise<EditorOperationResult>;
    /** Get STATE_CHANGED events as a map */
    getStateChanges(): Promise<EditorOperationResult>;
    /** Flush callbacks and poll state changes */
    flushAndPollState(): Promise<EditorOperationResult>;
    /**
     * Get text formatting at current cursor/selection position
     * Uses callback mechanism to retrieve STATE_CHANGED events
     * @returns TextFormat with bold, italic, underline, fontSize, fontName
     */
    getFormat(): Promise<EditorOperationResult>;
    /** Get raw formatting state from callbacks */
    getSelectionFormat(): Promise<EditorOperationResult>;
    /** Get a specific paragraph by index */
    getParagraph(index: number): Promise<EditorOperationResult>;
    /** Get multiple paragraphs */
    getParagraphs(start: number, count: number): Promise<EditorOperationResult>;
    /** Insert a new paragraph */
    insertParagraph(text: string, options?: {
        afterIndex?: number;
        style?: string;
    }): Promise<EditorOperationResult>;
    /** Replace a paragraph */
    replaceParagraph(index: number, text: string): Promise<EditorOperationResult>;
    /** Delete a paragraph */
    deleteParagraph(index: number): Promise<EditorOperationResult>;
    /** Format text in a range */
    formatText(range: {
        start: {
            paragraph: number;
            character: number;
        };
        end: {
            paragraph: number;
            character: number;
        };
    }, format: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        fontSize?: number;
        fontName?: string;
    }): Promise<EditorOperationResult>;
    /** Replace text in document */
    replaceText(find: string, replace: string, options?: {
        paragraph?: number;
        all?: boolean;
    }): Promise<EditorOperationResult>;
    /**
     * Save and close the document, returning the modified data
     * @returns The modified document as Uint8Array
     */
    close(): Promise<Uint8Array | undefined>;
    private assertOpen;
}
/**
 * Create drop zone for file conversion
 */
declare function createDropZone(element: HTMLElement | string, options: BrowserWasmPaths & {
    outputFormat: OutputFormat;
    onConvert?: (result: ConversionResult) => void;
    onError?: (error: Error) => void;
    onProgress?: (progress: {
        percent: number;
        message: string;
    }) => void;
    autoDownload?: boolean;
}): {
    destroy: () => void;
};
/**
 * Quick convert with auto-download
 */
declare function quickConvert(file: File, outputFormat: OutputFormat, options: BrowserWasmPaths & {
    download?: boolean;
}): Promise<ConversionResult>;

export { BrowserConverter, type BrowserConverterOptions, BrowserEditorProxy, type BrowserWasmPaths, CalcEditor, type CalcStructure, ConversionError, ConversionErrorCode, type ConversionOptions, type ConversionResult, DEFAULT_WASM_BASE_URL, type DocumentStructure, DrawEditor, type DrawStructure, EXTENSION_TO_FORMAT, type EmscriptenFS, type EmscriptenModule, FORMAT_FILTERS, FORMAT_MIME_TYPES, type ImageOptions, ImpressEditor, type ImpressStructure, type InputFormat, type LibreOfficeWasmOptions, OfficeEditor, type OpenDocumentOptions, type OperationResult, type OutputFormat, type PdfOptions, type ProgressInfo, type WasmLoadPhase, type WasmLoadProgress, WorkerBrowserConverter, type WorkerBrowserConverterOptions, WriterEditor, type WriterStructure, createDropZone, createEditor, createWasmPaths, isCalcEditor, isDrawEditor, isImpressEditor, isWriterEditor, quickConvert };
