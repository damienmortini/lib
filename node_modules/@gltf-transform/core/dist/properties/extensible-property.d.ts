import type { Nullable } from '../constants.js';
import type { ExtensionProperty } from './extension-property.js';
import { Property, IProperty } from './property.js';
export interface IExtensibleProperty extends IProperty {
    extensions: {
        [key: string]: ExtensionProperty;
    };
}
/**
 * *A {@link Property} that can have {@link ExtensionProperty} instances attached.*
 *
 * Most properties are extensible. See the {@link Extension} documentation for information about
 * how to use extensions.
 *
 * @category Properties
 */
export declare abstract class ExtensibleProperty<T extends IExtensibleProperty = IExtensibleProperty> extends Property<T> {
    protected getDefaults(): Nullable<T>;
    /** Returns an {@link ExtensionProperty} attached to this Property, if any. */
    getExtension<Prop extends ExtensionProperty>(name: string): Prop | null;
    /**
     * Attaches the given {@link ExtensionProperty} to this Property. For a given extension, only
     * one ExtensionProperty may be attached to any one Property at a time.
     */
    setExtension<Prop extends ExtensionProperty>(name: string, extensionProperty: Prop | null): this;
    /** Lists all {@link ExtensionProperty} instances attached to this Property. */
    listExtensions(): ExtensionProperty[];
}
