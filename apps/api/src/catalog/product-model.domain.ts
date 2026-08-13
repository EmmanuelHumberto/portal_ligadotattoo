export type ProductLifecycle =
  | 'ANNOUNCED' | 'ACTIVE' | 'DISCONTINUED' | 'LEGACY' | 'UNKNOWN';

export class ProductModel {
  private constructor(
    readonly id: string,
    readonly manufacturerId: string,
    readonly productTypeKey: string,
    private _name: string,
    readonly slug: string,
    readonly brandId: string | null,
    private _modelCode: string | null,
    private _lifecycle: ProductLifecycle,
    private _version: number,
  ) {}

  static create(input: {
    id: string; manufacturerId: string; productTypeKey: string;
    name: string; slug: string; brandId?: string; modelCode?: string;
  }) {
    if (!input.name.trim()) throw new Error('Product name is required');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug))
      throw new Error('Invalid product slug');
    return new ProductModel(
      input.id, input.manufacturerId, input.productTypeKey,
      input.name.trim(), input.slug, input.brandId ?? null,
      input.modelCode ?? null, 'ACTIVE', 1,
    );
  }

  rename(name: string) {
    if (!name.trim()) throw new Error('Product name is required');
    this._name = name.trim();
  }

  changeLifecycle(value: ProductLifecycle) { this._lifecycle = value; }

  get name() { return this._name; }
  get modelCode() { return this._modelCode; }
  get lifecycle() { return this._lifecycle; }
  get version() { return this._version; }
}
