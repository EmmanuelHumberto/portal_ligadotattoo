// Esquema de ficha técnica por categoria de produto.
// Usado pelo formulário do admin (apps/web/app/admin/produtos) para renderizar
// os campos corretos de cada tipo e pela ação de salvar especificações.

export type SpecField = {
  key: string;
  label: string;
  unit?: string;       // unidade fixa exibida e gravada no fact
  placeholder?: string;
};

export type SpecGroup = {
  title: string;
  fields: SpecField[];
};

const MACHINE_FIELDS: SpecField[] = [
  { key: 'voltage', label: 'Tensão', unit: 'V' },
  { key: 'rpm', label: 'RPM (velocidade)', unit: 'rpm' },
  { key: 'stroke', label: 'Curso', unit: 'mm' },
  { key: 'grip_protrusion', label: 'Protrusão do grip', unit: 'mm' },
  { key: 'weight', label: 'Peso', unit: 'g' },
  { key: 'length', label: 'Comprimento', unit: 'mm' },
  { key: 'diameter', label: 'Diâmetro', unit: 'mm' },
  { key: 'transmission_type', label: 'Sistema de transmissão' },
  { key: 'electrical_connection', label: 'Conexão elétrica' },
];

const MOTOR_FIELDS: SpecField[] = [
  { key: 'motor_type', label: 'Tipo de motor' },
  { key: 'motor_nominal_voltage', label: 'Tensão nominal', unit: 'V' },
  { key: 'motor_rpm', label: 'RPM', unit: 'rpm' },
  { key: 'motor_nominal_torque', label: 'Torque nominal' },
  { key: 'motor_dimensions', label: 'Medidas' },
  { key: 'motor_shaft_length', label: 'Tamanho do eixo', unit: 'mm' },
  { key: 'motor_shaft_diameter', label: 'Diâmetro do eixo', unit: 'mm' },
];

const MACHINE_BATTERY_FIELDS: SpecField[] = [
  { key: 'battery_capacity', label: 'Capacidade da bateria', unit: 'mAh' },
  { key: 'battery_connectivity', label: 'Conectividade da bateria', placeholder: 'BLE' },
];

const BATTERY_FIELDS: SpecField[] = [
  { key: 'electrical_connection', label: 'Conexão elétrica' },
  { key: 'capacity', label: 'Capacidade', unit: 'mAh' },
  { key: 'display_type', label: 'Tipo de display' },
  { key: 'connectivity', label: 'Conectividade', placeholder: 'BLE' },
  { key: 'charging_current', label: 'Corrente de carregamento', unit: 'A' },
  { key: 'charging_input_voltage', label: 'Tensão de entrada para carregamento', unit: 'V' },
];

const POWER_SUPPLY_FIELDS: SpecField[] = [
  { key: 'input_voltage', label: 'Tensão de entrada', unit: 'V' },
  { key: 'output_voltage', label: 'Tensão de saída', unit: 'V' },
  { key: 'connectivity', label: 'Conectividade' },
  { key: 'protections', label: 'Proteções' },
];

const CARTRIDGE_FIELDS: SpecField[] = [
  { key: 'needle_config', label: 'Configuração da agulha' },
  { key: 'needle_diameter', label: 'Diâmetro da agulha', unit: 'mm' },
  { key: 'quantity', label: 'Quantidade' },
  { key: 'sterile', label: 'Esterilizado' },
];

const INK_FIELDS: SpecField[] = [
  { key: 'colors', label: 'Cores' },
  { key: 'volume', label: 'Volume', unit: 'ml' },
  { key: 'vegan', label: 'Vegano' },
  { key: 'base', label: 'Base' },
];

const ACCESSORY_FIELDS: SpecField[] = [
  { key: 'material', label: 'Material' },
  { key: 'dimensions', label: 'Dimensões' },
  { key: 'weight', label: 'Peso', unit: 'g' },
];

export function specGroupsFor(type: string): SpecGroup[] {
  switch (type) {
    case 'PEN':
    case 'ROTARY':
      return [
        { title: 'Máquina', fields: MACHINE_FIELDS },
        { title: 'Motor', fields: MOTOR_FIELDS },
        { title: 'Bateria (máquina wireless)', fields: MACHINE_BATTERY_FIELDS },
      ];
    case 'COIL':
      return [{ title: 'Máquina', fields: MACHINE_FIELDS }];
    case 'BATTERY':
      return [{ title: 'Bateria', fields: BATTERY_FIELDS }];
    case 'POWER_SUPPLY':
      return [{ title: 'Fonte', fields: POWER_SUPPLY_FIELDS }];
    case 'CARTRIDGE':
      return [{ title: 'Cartucho', fields: CARTRIDGE_FIELDS }];
    case 'INK':
      return [{ title: 'Tinta', fields: INK_FIELDS }];
    default:
      return [{ title: 'Acessório', fields: ACCESSORY_FIELDS }];
  }
}

export function allSpecFields(type: string): SpecField[] {
  return specGroupsFor(type).flatMap(g => g.fields);
}
