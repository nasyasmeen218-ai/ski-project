// ==============================
// Mock Products (Inventory)
// ==============================
export const mockProducts = [
  {
    id: "p1",
    name: "Ski Jacket",
    category: "clothing",
    gender: "male",
    type: "Jackets",
    quantity: 10,
    availableQuantity: 7,
    rentedQuantity: 3,
  },
  {
    id: "p2",
    name: "Ski Pants",
    category: "clothing",
    gender: "female",
    type: "Pants",
    quantity: 8,
    availableQuantity: 8,
    rentedQuantity: 0,
  },
  {
    id: "p3",
    name: "Thermal Shirt",
    category: "clothing",
    gender: "male",
    type: "Thermal Wear",
    quantity: 15,
    availableQuantity: 12,
    rentedQuantity: 3,
  },
  {
    id: "p4",
    name: "Ski Helmet",
    category: "equipment",
    type: "Helmets",
    quantity: 12,
    availableQuantity: 9,
    rentedQuantity: 3,
  },
  {
    id: "p5",
    name: "Ski Goggles",
    category: "equipment",
    type: "Goggles",
    quantity: 20,
    availableQuantity: 18,
    rentedQuantity: 2,
  },
  {
    id: "p6",
    name: "Ski Boots",
    category: "equipment",
    type: "Boots",
    quantity: 14,
    availableQuantity: 10,
    rentedQuantity: 4,
  },
];

// ==============================
// Mock Rental / Inventory Logs
// ==============================
export const mockRentalRecords = [
  {
    id: "1",
    action: "rental",
    productName: "Ski Boots",
    userName: "John Doe",
    quantity: 2,
    rentalDays: 3,
    timestamp: "2026-01-20T10:30:00Z",
    endDate: "2026-01-23T10:30:00Z",
  },
  {
    id: "2",
    action: "take",
    productName: "Helmet",
    userName: "Anna Smith",
    quantity: 1,
    timestamp: "2026-01-21T09:15:00Z",
  },
  {
    id: "3",
    action: "return",
    productName: "Snowboard",
    userName: "Mike Brown",
    quantity: 1,
    timestamp: "2026-01-21T14:45:00Z",
  },
];
