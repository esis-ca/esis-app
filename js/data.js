/**
 * ESIS, C.A. - SISTEMA DE GESTIÓN ADMINISTRATIVA, FINANCIERA Y OPERATIVA
 * Datos Iniciales y Semilla (Seed Data)
 * Especializado en Seguridad Petrolera, Industrial y Comercial
 */

const ESIS_SEED_DATA = {
  // Tasas de cambio predeterminadas
  rates: {
    bcv: 72.50,       // Tasa Oficial BCV Bs / USD
    usdt: 74.20,      // Tasa USDT / Bs
    lastUpdated: new Date().toISOString()
  },

  // Catálogo de hasta 20 Proyectos Simultáneos
  projects: [
    { id: 'PRJ-01', code: 'P01', name: 'Seguridad Faja Petrolífera Orinoco (Petropiar)', client: 'PDVSA Petropiar', budgetUSD: 120000, status: 'ACTIVO', description: 'Custodia perimetral y control de acceso en taladros y macollas.' },
    { id: 'PRJ-02', code: 'P02', name: 'Refinería Puerto La Cruz - Custodia Perimetral', client: 'PDVSA Refinación', budgetUSD: 95000, status: 'ACTIVO', description: 'Vigilancia 24/7 y control de accesos vehiculares y peatonales.' },
    { id: 'PRJ-03', code: 'P03', name: 'Complejo Criogénico Jose - Protección Activos', client: 'Consorcio Jose Gas', budgetUSD: 110000, status: 'ACTIVO', description: 'Monitoreo CCTV y patrullaje motorizado en áreas operacionales.' },
    { id: 'PRJ-04', code: 'P04', name: 'Custodia Flota Taladros Morichal', client: 'Sinovensa JV', budgetUSD: 85000, status: 'ACTIVO', description: 'Escolta armada y vigilancia en movimiento de taladros petroleros.' },
    { id: 'PRJ-05', code: 'P05', name: 'Seguridad Planta Petroquímica Pequiven Jose', client: 'Pequiven C.A.', budgetUSD: 65000, status: 'ACTIVO', description: 'Custodia física integral en planta de amoníaco y urea.' },
    { id: 'PRJ-06', code: 'P06', name: 'Custodia Transporte de Crudo Anzoátegui Sur', client: 'Chevron Petroindependencia', budgetUSD: 78000, status: 'ACTIVO', description: 'Custodia en tránsito de cisternas y equipos pesados.' },
    { id: 'PRJ-07', code: 'P07', name: 'Seguridad Sede Corporativa & Centro Logístico', client: 'ESIS C.A. Central', budgetUSD: 30000, status: 'ACTIVO', description: 'Base operacional y centro de comando en Lechería.' },
    { id: 'PRJ-08', code: 'P08', name: 'Protección Instalaciones Punta de Mata (Monagas)', client: 'PetroMonagas', budgetUSD: 90000, status: 'ACTIVO', description: 'Resguardo de campamento y facilidades de producción petrolera.' },
    { id: 'PRJ-09', code: 'P09', name: 'Custodia Muelle y Flota Marítima Guanta', client: 'Bolivariana de Puertos / Petrocedeño', budgetUSD: 55000, status: 'ACTIVO', description: 'Seguridad portuaria y resguardo de gabarras y remolcadores.' },
    { id: 'PRJ-10', code: 'P10', name: 'Seguridad Residencial Complejos Petroleros', client: 'Asociación Residentes Campo El Tigre', budgetUSD: 40000, status: 'ACTIVO', description: 'Control de garitas y vigilancia comunitaria en villas petroleras.' },
    { id: 'PRJ-11', code: 'P11', name: 'Protección Oleoducto San Tomé - Jose', client: 'PDVSA Transporte', budgetUSD: 80000, status: 'ACTIVO', description: 'Patrullaje terrestre y drones en línea de tuberías.' },
    { id: 'PRJ-12', code: 'P12', name: 'Seguridad Taladro PDVSA 12 Maturín', client: 'PDVSA Servicios Petroleros', budgetUSD: 70000, status: 'ACTIVO', description: 'Servicio de vigilancia especializada en pozo petrolero.' }
  ],

  // Directorio de Clientes
  clients: [
    { id: 'CLI-01', name: 'PDVSA Petropiar S.A.', rif: 'J-29384912-0', phone: '+58 281-280-1122', email: 'finanzas@petropiar.com', contact: 'Ing. Carlos Mendoza' },
    { id: 'CLI-02', name: 'PDVSA Refinación Oriente', rif: 'J-00012999-5', phone: '+58 281-260-3344', email: 'administracion@refinacion.pdvsa.com', contact: 'Lic. Mariana Rojas' },
    { id: 'CLI-03', name: 'Consorcio Jose Gas C.A.', rif: 'J-31456789-1', phone: '+58 281-270-5566', email: 'pagos@josegas.com.ve', contact: 'Ing. Roberto Silva' },
    { id: 'CLI-04', name: 'Sinovensa Petrolera JV', rif: 'J-30987654-2', phone: '+58 283-241-7788', email: 'cuentas@sinovensa.com.ve', contact: 'Lic. Wei Zhang / Carmen Soto' },
    { id: 'CLI-05', name: 'Pequiven C.A. Fertilizantes', rif: 'J-00034567-8', phone: '+58 281-280-9900', email: 'tesoreria@pequiven.gob.ve', contact: 'Abg. Luis Gómez' },
    { id: 'CLI-06', name: 'Chevron Petroindependencia', rif: 'J-40123456-7', phone: '+58 281-282-4455', email: 'ap_venezuela@chevron.com', contact: 'Lic. Daniela Duarte' },
    { id: 'CLI-07', name: 'PetroMonagas S.A.', rif: 'J-31122334-9', phone: '+58 291-640-1234', email: 'finanzas@petromonagas.com', contact: 'Ing. Franklin Vivas' },
    { id: 'CLI-08', name: 'Bolivariana de Puertos Guanta', rif: 'G-20008976-4', phone: '+58 281-268-3000', email: 'administracion@bolipuertos.gob.ve', contact: 'Cap. Jorge Medina' }
  ],

  // Cuentas Bancarias
  bankAccounts: [
    {
      id: 'ACC-BINANCE',
      name: 'Binance (USDT)',
      bank: 'Binance Exchange',
      accountNumber: 'esis_corp_pay@binance.com',
      currency: 'USDT',
      balance: 24850.00,
      type: 'WALLET_CRYPTO'
    },
    {
      id: 'ACC-BDV',
      name: 'Banco de Venezuela (Bs)',
      bank: 'Banco de Venezuela',
      accountNumber: '0102-0456-11-0001234567',
      currency: 'VES',
      balance: 1452300.50,
      type: 'CORRIENTE'
    },
    {
      id: 'ACC-BANESCO',
      name: 'Banesco JM (Bs)',
      bank: 'Banesco Banco Universal',
      accountNumber: '0134-0890-22-0009876543',
      currency: 'VES',
      balance: 2180450.00,
      type: 'CORRIENTE'
    }
  ],

  // Categorías y Subcategorías de Gastos Operativos y Petroleros
  expenseCategories: [
    {
      category: 'Operaciones de Seguridad & Custodia',
      subcategories: ['Nómina Oficiales de Seguridad', 'Horas Extras y Guardias Especiales', 'Servicio de Escolta Armada', 'Dotación de Uniformes e Indumentaria Táctica', 'Armamento, Municiones y Permisología DAEX']
    },
    {
      category: 'Logística, Flota y Combustible',
      subcategories: ['Combustible Gasoil / Gasolina Flota', 'Mantenimiento Preventivo Unidades 4x4', 'Reparación y Repuestos Vehiculares', 'GPS, Radiocomunicación y Antenas Satelitales', 'Peajes y Viáticos en Campo']
    },
    {
      category: 'Alimentación y Campamento',
      subcategories: ['Catering y Alimentación de Guardias', 'Hospedaje / Hotelería en Tránsito', 'Agua Mineral e Insumos de Campo', 'Mantenimiento de Puestos de Control']
    },
    {
      category: 'Equipos de Protección y Tecnología',
      subcategories: ['Chalecos Antibalas Nivel III-A', 'CCTV, Cámaras Térmicas y Drones', 'Linternas Tácticas y Detectores de Metales', 'Conos, Barreras y Señalización Vial']
    },
    {
      category: 'Administración, Fiscal y Legal',
      subcategories: ['Alquiler Sede Administrativa Lechería', 'Servicios Básicos (Electricidad, Agua, Internet Fibra)', 'Honorarios Contables y Legales', 'Impuestos Municipales y Tasas', 'Seguro de Responsabilidad Civil']
    }
  ],

  // Movimientos Bancarios Semilla
  bankTransactions: [
    {
      id: 'BNK-001',
      date: '2026-08-05',
      type: 'INGRESO', // INGRESO, EGRESO, TRANSFERENCIA, PAGO, COMPRA, CAMBIO_DIVISAS
      accountId: 'ACC-BINANCE',
      reference: 'TX-BIN-984321',
      party: 'PDVSA Petropiar S.A.',
      project: 'PRJ-01',
      amount: 15000.00,
      currency: 'USDT',
      rate: 1.0,
      amountVES: 1113000.00,
      description: 'Cobro Factura N° FAC-2026-001 - Servicio Custodia Faja',
      category: 'Cobro de Factura',
      conciliated: true,
      linkedDoc: 'FAC-2026-001'
    },
    {
      id: 'BNK-002',
      date: '2026-08-08',
      type: 'CAMBIO_DIVISAS',
      accountId: 'ACC-BINANCE',
      destinationAccountId: 'ACC-BANESCO',
      reference: 'P2P-774412',
      party: 'Binance P2P Comprador Verificado',
      project: 'PRJ-07',
      amount: 5000.00,
      currency: 'USDT',
      rate: 74.20, // Tasa USDT -> Bs
      amountVES: 371000.00,
      description: 'Venta 5,000 USDT P2P para pago de nómina en Banesco',
      category: 'Cambio de Divisas',
      conciliated: true
    },
    {
      id: 'BNK-003',
      date: '2026-08-10',
      type: 'EGRESO',
      subType: 'GASTO',
      accountId: 'ACC-BANESCO',
      reference: 'TRANSF-889911',
      party: 'Inversiones Combustibles Oriente C.A.',
      project: 'PRJ-01',
      amount: 45000.00,
      currency: 'VES',
      rate: 72.50,
      amountUSD: 620.69,
      description: 'Suministro 800L Gasoil para patrullas Faja Petrolífera',
      category: 'Logística, Flota y Combustible',
      conciliated: true
    },
    {
      id: 'BNK-004',
      date: '2026-08-12',
      type: 'EGRESO',
      subType: 'GASTO',
      accountId: 'ACC-BDV',
      reference: 'DEB-004523',
      party: 'Tácticos y Blindajes de Venezuela C.A.',
      project: 'PRJ-02',
      amount: 85000.00,
      currency: 'VES',
      rate: 72.50,
      amountUSD: 1172.41,
      description: 'Adquisición de 10 chalecos balísticos y linternas tácticas',
      category: 'Equipos de Protección y Tecnología',
      conciliated: true
    },
    {
      id: 'BNK-005',
      date: '2026-08-15',
      type: 'INGRESO',
      accountId: 'ACC-BDV',
      reference: 'TRANSF-BDV-667788',
      party: 'PDVSA Refinación Oriente',
      project: 'PRJ-02',
      amount: 725000.00,
      currency: 'VES',
      rate: 72.50,
      amountUSD: 10000.00,
      description: 'Cobro Parcial Factura FAC-2026-002',
      category: 'Cobro de Factura',
      conciliated: true,
      linkedDoc: 'FAC-2026-002'
    },
    {
      id: 'BNK-006',
      date: '2026-08-18',
      type: 'EGRESO',
      subType: 'GASTO',
      accountId: 'ACC-BINANCE',
      reference: 'TX-BIN-654987',
      party: 'Global Sat Communications USA',
      project: 'PRJ-03',
      amount: 1200.00,
      currency: 'USDT',
      rate: 74.20,
      amountVES: 89040.00,
      description: 'Pago de servicio satelital Starlink y Radios POC',
      category: 'Logística, Flota y Combustible',
      conciliated: false
    }
  ],

  // Facturas Emitidas
  invoices: [
    {
      id: 'INV-001',
      docNumber: 'FAC-2026-001',
      controlNumber: '00-001452',
      date: '2026-08-01',
      dueDate: '2026-08-31',
      type: 'FACTURA', // FACTURA, NOTA_CREDITO, NOTA_DEBITO, RETENCION_IVA, RETENCION_ISLR, RETENCION_MUNICIPAL
      clientId: 'CLI-01',
      clientName: 'PDVSA Petropiar S.A.',
      clientRif: 'J-29384912-0',
      projectId: 'PRJ-01',
      projectName: 'Seguridad Faja Petrolífera Orinoco (Petropiar)',
      concept: 'Servicio de vigilancia armada, custodia perimetral y monitoreo taladros mes Julio 2026',
      
      // Sección USD
      baseUSD: 20000.00,
      ivaPercent: 16.0,
      ivaUSD: 3200.00,
      totalUSD: 23200.00,
      retIvaUSD: 2400.00,      // Retención IVA 75%
      retIslrUSD: 400.00,      // Retención ISLR 2%
      retMunicipalUSD: 200.00, // Retención Municipal 1%
      netUSD: 20200.00,
      
      // Sección Bs
      rateBCV: 72.50,
      baseVES: 1450000.00,
      ivaVES: 232000.00,
      totalVES: 1682000.00,
      retIvaVES: 174000.00,
      retIslrVES: 29000.00,
      retMunicipalVES: 14500.00,
      netVES: 1464500.00,

      // Estado CxC
      paidUSD: 15000.00,
      pendingUSD: 5200.00,
      status: 'PARCIAL', // PENDIENTE, PARCIAL, PAGADO
      observations: 'Abono de 15,000 USDT recibido en Binance el 05/08/2026'
    },
    {
      id: 'INV-002',
      docNumber: 'FAC-2026-002',
      controlNumber: '00-001453',
      date: '2026-08-03',
      dueDate: '2026-08-18', // Vencida
      type: 'FACTURA',
      clientId: 'CLI-02',
      clientName: 'PDVSA Refinación Oriente',
      clientRif: 'J-00012999-5',
      projectId: 'PRJ-02',
      projectName: 'Refinería Puerto La Cruz - Custodia Perimetral',
      concept: 'Custodia perimetral y control vehicular en Refinería PLC - Período quincenal',
      
      baseUSD: 15000.00,
      ivaPercent: 16.0,
      ivaUSD: 2400.00,
      totalUSD: 17400.00,
      retIvaUSD: 1800.00,
      retIslrUSD: 300.00,
      retMunicipalUSD: 150.00,
      netUSD: 15150.00,

      rateBCV: 72.50,
      baseVES: 1087500.00,
      ivaVES: 174000.00,
      totalVES: 1261500.00,
      retIvaVES: 130500.00,
      retIslrVES: 21750.00,
      retMunicipalVES: 10875.00,
      netVES: 1098375.00,

      paidUSD: 10000.00,
      pendingUSD: 5150.00,
      status: 'PARCIAL',
      observations: 'Abono registrado en BDV por Bs 725,000 el 15/08/2026'
    },
    {
      id: 'INV-003',
      docNumber: 'FAC-2026-003',
      controlNumber: '00-001454',
      date: '2026-08-06',
      dueDate: '2026-09-05',
      type: 'FACTURA',
      clientId: 'CLI-03',
      clientName: 'Consorcio Jose Gas C.A.',
      clientRif: 'J-31456789-1',
      projectId: 'PRJ-03',
      projectName: 'Complejo Criogénico Jose - Protección Activos',
      concept: 'Monitoreo electrónico, circuito cerrado y patrullaje nocturno Complejo Criogénico',
      
      baseUSD: 18500.00,
      ivaPercent: 16.0,
      ivaUSD: 2960.00,
      totalUSD: 21460.00,
      retIvaUSD: 2220.00,
      retIslrUSD: 370.00,
      retMunicipalUSD: 185.00,
      netUSD: 18685.00,

      rateBCV: 72.50,
      baseVES: 1341250.00,
      ivaVES: 214600.00,
      totalVES: 1555850.00,
      retIvaVES: 160950.00,
      retIslrVES: 26825.00,
      retMunicipalVES: 13412.50,
      netVES: 1354662.50,

      paidUSD: 0.00,
      pendingUSD: 18685.00,
      status: 'PENDIENTE',
      observations: 'En trámite de orden de pago con el departamento de tesorería'
    },
    {
      id: 'INV-004',
      docNumber: 'FAC-2026-004',
      controlNumber: '00-001455',
      date: '2026-07-15',
      dueDate: '2026-07-30', // Más de 20 días de mora
      type: 'FACTURA',
      clientId: 'CLI-04',
      clientName: 'Sinovensa Petrolera JV',
      clientRif: 'J-30987654-2',
      projectId: 'PRJ-04',
      projectName: 'Custodia Flota Taladros Morichal',
      concept: 'Servicio de escolta armada y protección a convoyes de taladros petroleros Morichal',
      
      baseUSD: 12000.00,
      ivaPercent: 16.0,
      ivaUSD: 1920.00,
      totalUSD: 13920.00,
      retIvaUSD: 1440.00,
      retIslrUSD: 240.00,
      retMunicipalUSD: 120.00,
      netUSD: 12120.00,

      rateBCV: 72.50,
      baseVES: 870000.00,
      ivaVES: 139200.00,
      totalVES: 1009200.00,
      retIvaVES: 104400.00,
      retIslrVES: 17400.00,
      retMunicipalVES: 8700.00,
      netVES: 878700.00,

      paidUSD: 0.00,
      pendingUSD: 12120.00,
      status: 'PENDIENTE',
      observations: 'Factura con notificación de cobro enviada a gerencia financiera'
    }
  ],

  // Gastos Operativos y Administrativos
  expenses: [
    {
      id: 'EXP-001',
      date: '2026-08-10',
      category: 'Logística, Flota y Combustible',
      subcategory: 'Combustible Gasoil / Gasolina Flota',
      projectId: 'PRJ-01',
      projectName: 'Seguridad Faja Petrolífera Orinoco (Petropiar)',
      amountUSD: 620.69,
      amountVES: 45000.00,
      rateBCV: 72.50,
      supplier: 'Inversiones Combustibles Oriente C.A.',
      invoiceNumber: 'FC-88219',
      bankAccountId: 'ACC-BANESCO',
      bankName: 'Banesco JM (Bs)',
      paymentMethod: 'TRANSFERENCIA',
      status: 'PAGADO',
      observations: 'Gasoil para 4 camionetas patrulla asignadas a macollas'
    },
    {
      id: 'EXP-002',
      date: '2026-08-12',
      category: 'Equipos de Protección y Tecnología',
      subcategory: 'Chalecos Antibalas Nivel III-A',
      projectId: 'PRJ-02',
      projectName: 'Refinería Puerto La Cruz - Custodia Perimetral',
      amountUSD: 1172.41,
      amountVES: 85000.00,
      rateBCV: 72.50,
      supplier: 'Tácticos y Blindajes de Venezuela C.A.',
      invoiceNumber: 'FAC-00912',
      bankAccountId: 'ACC-BDV',
      bankName: 'Banco de Venezuela (Bs)',
      paymentMethod: 'TRANSFERENCIA',
      status: 'PAGADO',
      observations: 'Dotación reglamentaria de seguridad física'
    },
    {
      id: 'EXP-003',
      date: '2026-08-14',
      category: 'Alimentación y Campamento',
      subcategory: 'Catering y Alimentación de Guardias',
      projectId: 'PRJ-01',
      projectName: 'Seguridad Faja Petrolífera Orinoco (Petropiar)',
      amountUSD: 950.00,
      amountVES: 68875.00,
      rateBCV: 72.50,
      supplier: 'Servicios Gastronómicos del Sur C.A.',
      invoiceNumber: 'FAC-0442',
      bankAccountId: null,
      bankName: 'POR PAGAR',
      paymentMethod: 'CREDITO',
      status: 'PENDIENTE',
      observations: 'Almuerzos y cenas para 30 oficiales turno rotativo'
    },
    {
      id: 'EXP-004',
      date: '2026-08-18',
      category: 'Logística, Flota y Combustible',
      subcategory: 'GPS, Radiocomunicación y Antenas Satelitales',
      projectId: 'PRJ-03',
      projectName: 'Complejo Criogénico Jose - Protección Activos',
      amountUSD: 1200.00,
      amountVES: 89040.00,
      rateBCV: 74.20,
      supplier: 'Global Sat Communications USA',
      invoiceNumber: 'INV-US-9912',
      bankAccountId: 'ACC-BINANCE',
      bankName: 'Binance (USDT)',
      paymentMethod: 'CRYPTO_USDT',
      status: 'PAGADO',
      observations: 'Enlace Starlink y servidores de respaldo'
    }
  ],

  // Cuentas por Pagar (CxP) Proveedores
  payables: [
    {
      id: 'CXP-001',
      supplier: 'Servicios Gastronómicos del Sur C.A.',
      rif: 'J-40911223-1',
      projectId: 'PRJ-01',
      projectName: 'Seguridad Faja Petrolífera Orinoco (Petropiar)',
      invoiceNumber: 'FAC-0442',
      issueDate: '2026-08-14',
      dueDate: '2026-08-28',
      amountUSD: 950.00,
      amountVES: 68875.00,
      paidUSD: 0.00,
      pendingUSD: 950.00,
      status: 'PENDIENTE',
      observations: 'Catering mensual base Faja'
    },
    {
      id: 'CXP-002',
      supplier: 'Cauchos y Baterías El Tigre C.A.',
      rif: 'J-30119988-4',
      projectId: 'PRJ-04',
      projectName: 'Custodia Flota Taladros Morichal',
      invoiceNumber: 'FAC-10023',
      issueDate: '2026-08-02',
      dueDate: '2026-08-16', // Vencida
      amountUSD: 1400.00,
      amountVES: 101500.00,
      paidUSD: 400.00,
      pendingUSD: 1000.00,
      status: 'PARCIAL',
      observations: '8 Cauchos rincón 16 para patrullas Hilux'
    }
  ],

  // Conciliaciones Bancarias Realizadas
  reconciliations: [
    {
      id: 'REC-2026-07',
      period: '2026-07',
      accountId: 'ACC-BINANCE',
      bankName: 'Binance (USDT)',
      bookBalance: 24850.00,
      statementBalance: 24850.00,
      difference: 0.00,
      status: 'CONCILIADO',
      date: '2026-08-01',
      auditor: 'Lic. Administrador ESIS C.A.'
    },
    {
      id: 'REC-2026-07-BDV',
      period: '2026-07',
      accountId: 'ACC-BDV',
      bankName: 'Banco de Venezuela (Bs)',
      bookBalance: 1452300.50,
      statementBalance: 1452300.50,
      difference: 0.00,
      status: 'CONCILIADO',
      date: '2026-08-01',
      auditor: 'Lic. Administrador ESIS C.A.'
    }
  ]
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ESIS_SEED_DATA = ESIS_SEED_DATA;
}
