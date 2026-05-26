import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12);
  const cashierPassword = await bcrypt.hash('cashier123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { username: 'cashier1' },
    update: {},
    create: {
      username: 'cashier1',
      password: cashierPassword,
      name: 'Cashier Satu',
      role: 'CASHIER',
    },
  });

  await prisma.user.upsert({
    where: { username: 'manager1' },
    update: {},
    create: {
      username: 'manager1',
      password: cashierPassword,
      name: 'Manager Satu',
      role: 'MANAGER',
    },
  });

  const categories = [
    { name: 'Food & Beverages', description: 'F&B products' },
    { name: 'Clothing', description: 'Fashion items' },
    { name: 'Hardware', description: 'Tools and materials' },
  ];

  const createdCategories: Record<string, number> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { id: categories.indexOf(cat) + 1 },
      update: { name: cat.name },
      create: cat,
    });
    createdCategories[cat.name] = created.id;
  }

  const products = [
    { sku: 'KOPI-001', name: 'Kopi Tubruk', price: 5000, costPrice: 2000, categoryId: createdCategories['Food & Beverages'] },
    { sku: 'KOPI-002', name: 'Kopi Susu', price: 8000, costPrice: 3000, categoryId: createdCategories['Food & Beverages'] },
    { sku: 'KOPI-003', name: 'Matcha Latte', price: 12000, costPrice: 5000, categoryId: createdCategories['Food & Beverages'] },
    { sku: 'KOPI-004', name: 'Espresso', price: 7000, costPrice: 2500, categoryId: createdCategories['Food & Beverages'] },
    { sku: 'KOPI-005', name: 'Cappuccino', price: 10000, costPrice: 4000, categoryId: createdCategories['Food & Beverages'] },
    { sku: 'CLO-001', name: 'Kaos Polos', price: 59000, costPrice: 35000, categoryId: createdCategories['Clothing'] },
    { sku: 'CLO-002', name: 'Kemeja Flanel', price: 99000, costPrice: 60000, categoryId: createdCategories['Clothing'] },
    { sku: 'CLO-003', name: 'Celana Jeans', price: 149000, costPrice: 90000, categoryId: createdCategories['Clothing'] },
    { sku: 'CLO-004', name: 'Jaket Hoodie', price: 179000, costPrice: 110000, categoryId: createdCategories['Clothing'] },
    { sku: 'HRD-001', name: 'Palu 500g', price: 25000, costPrice: 15000, categoryId: createdCategories['Hardware'] },
    { sku: 'HRD-002', name: 'Obeng Set', price: 45000, costPrice: 28000, categoryId: createdCategories['Hardware'] },
    { sku: 'HRD-003', name: 'Tang Kombinasi', price: 35000, costPrice: 20000, categoryId: createdCategories['Hardware'] },
    { sku: 'HRD-004', name: 'Meteran 5m', price: 15000, costPrice: 8000, categoryId: createdCategories['Hardware'] },
    { sku: 'HRD-005', name: 'Bor Listrik', price: 299000, costPrice: 180000, categoryId: createdCategories['Hardware'] },
  ];

  for (const p of products) {
    const isClothing = p.sku.startsWith('CLO');
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, price: p.price },
      create: { ...p, stock: isClothing ? 0 : 25 },
    });
  }

  // Add variants to clothing products
  const kaos = await prisma.product.findUnique({ where: { sku: 'CLO-001' } });
  if (kaos) {
    const sizes = ['S', 'M', 'L', 'XL'];
    for (let i = 0; i < sizes.length; i++) {
      await prisma.productVariant.upsert({
        where: { id: kaos.id * 10 + i },
        update: { name: `Size ${sizes[i]}`, value: sizes[i] },
        create: {
          productId: kaos.id,
          name: `Size ${sizes[i]}`,
          value: sizes[i],
          stock: 10,
        },
      });
    }
  }

  const suppliers = [
    { name: 'PT Kopi Nusantara', contactPerson: 'Budi', phone: '081234567890', email: 'budi@kopinusantara.com' },
    { name: 'PT Fashion Indah', contactPerson: 'Sari', phone: '081234567891', email: 'sari@fashionindah.com' },
    { name: 'CV Hardware Jaya', contactPerson: 'Agus', phone: '081234567892', email: 'agus@hardwarejaya.com' },
  ];

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: suppliers.indexOf(s) + 1 },
      update: { name: s.name },
      create: s,
    });
  }

  const customers = [
    { name: 'Andi Pratama', phone: '085611111111' },
    { name: 'Dewi Lestari', phone: '085622222222' },
    { name: 'Rudi Hartono', phone: '085633333333' },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: customers.indexOf(c) + 1 },
      update: { name: c.name },
      create: c,
    });
  }

  console.log('Seed completed successfully');
  console.log(`  - Created ${products.length} products across ${categories.length} categories`);
  console.log(`  - Created 3+ users (admin / admin123, cashier1 / cashier123, manager1 / cashier123)`);
  console.log(`  - Created ${suppliers.length} suppliers and ${customers.length} customers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
