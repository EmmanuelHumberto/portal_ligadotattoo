export class Manufacturer {
  private constructor(
    readonly id: string,
    private _name: string,
    readonly slug: string,
    readonly officialWebsite: string | null,
    readonly countryCode: string | null,
    private _status: 'ACTIVE' | 'INACTIVE',
    private _version: number,
  ) {}

  static create(input: {
    id: string; name: string; slug: string;
    officialWebsite?: string; countryCode?: string;
  }) {
    const name = input.name.trim();
    if (!name) throw new Error('Manufacturer name is required');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug))
      throw new Error('Invalid manufacturer slug');
    return new Manufacturer(
      input.id, name, input.slug,
      input.officialWebsite ?? null,
      input.countryCode?.toUpperCase() ?? null,
      'ACTIVE', 1,
    );
  }

  static rehydrate(row: any) {
    return new Manufacturer(
      row.id, row.name, row.slug, row.official_website,
      row.country_code, row.status, row.version,
    );
  }

  get name() { return this._name; }
  get status() { return this._status; }
  get version() { return this._version; }
}
