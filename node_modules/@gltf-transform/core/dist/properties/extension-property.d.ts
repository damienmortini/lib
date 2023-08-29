import type { ExtensibleProperty } from './extensible-property.js';
import { Property, IProperty } from './property.js';
/**
 * *Base class for all {@link Property} types that can be attached by an {@link Extension}.*
 *
 * After an {@link Extension} is attached to a glTF {@link Document}, the Extension may be used to
 * construct ExtensionProperty instances, to be referenced throughout the document as prescribed by
 * the Extension. For example, the `KHR_materials_clearcoat` Extension defines a `Clearcoat`
 * ExtensionProperty, which is referenced by {@link Material} Properties in the Document, and may
 * contain references to {@link Texture} properties of its own.
 *
 * For more information on available extensions and their usage, see [Extensions](/extensions).
 *
 * Reference:
 * - [glTF → Extensions](https://github.com/KhronosGroup/gltf/blob/main/specification/2.0/README.md#specifying-extensions)
 *
 * @category Properties
 */
export declare abstract class ExtensionProperty<T extends IProperty = IProperty> extends Property<T> {
    static EXTENSION_NAME: string;
    abstract readonly extensionName: string;
    /** List of supported {@link Property} types. */
    abstract readonly parentTypes: string[];
    /** @hidden */
    _validateParent(parent: ExtensibleProperty): void;
}
