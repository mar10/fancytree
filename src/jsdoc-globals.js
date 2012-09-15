/* *****************************************************************************
 * Virtual objects for jsdoc documentation
 */
/**
 * Context object passed too hook functions.
 * @name HookContext
 * 
 * @property {Fancytree} tree
 * @property {any} widget
 * @property {FancytreeOptions} options
 * @property {Event} orgEvent
 * @property {FancytreeNode | null} node
 */
var HookContext = {};

/**
 * Data object passed to FancytreeNode() constructor.
 * @name NodeData
 * 
 * @property {String} title
 */
var NodeData = {};

/**
 * Data object passed to FancytreeNode#applyPatch.
 * @name NodePatch
 * 
 * @property {String} title
 */
var NodePatch = {};

/** Fancytree options
 * @name FancytreeOptions
 *
 * @property {object} ajax $.Ajax options
 * @property {Boolean} activeVisible: true: Make sure, active nodes are visible (expanded).
 * @property {Boolean} autoCollapse: false,
 * @property {Boolean} [checkbox=false] Display checkboxes to allow selection
 * @property clickFolderMode: 3,
 * @property extensions: [],
 * @property fx: { height: "toggle", duration: 200 },
 * @property idPrefix: "dt_",
 * @property keyPathSeparator: "/",
 * @property strings: {
 * @property _classNames: {
 * Events:
 * @property {function} lazyload
 */
var FancytreeOptions = {};
