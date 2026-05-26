import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Product, Category } from '../../types';

interface VariantInput {
  name: string;
  value: string;
  priceOverride: number | null;
  stock: number;
}

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [variants, setVariants] = useState<VariantInput[]>([]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data)).catch(() => {});
    if (id) {
      api.get(`/products/${id}`).then(({ data }) => {
        const p: Product = data.data;
        setSku(p.sku);
        setName(p.name);
        setDescription(p.description ?? '');
        setPrice(String(p.price));
        setCostPrice(p.costPrice ? String(p.costPrice) : '');
        setCategoryId(p.categoryId ? String(p.categoryId) : '');
        setBarcode(p.barcode ?? '');
        if (p.variants) {
          setVariants(
            p.variants.map((v) => ({
              name: v.name,
              value: v.value,
              priceOverride: v.priceOverride,
              stock: v.stock,
            })),
          );
        }
        setFetching(false);
      }).catch(() => navigate('/products'));
    }
  }, [id, navigate]);

  const addVariant = () => {
    setVariants([...variants, { name: '', value: '', priceOverride: null, stock: 0 }]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v,
    );
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sku.trim() || !name.trim() || !price) {
      setError('SKU, Name, and Price are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        costPrice: costPrice ? Number(costPrice) : null,
        categoryId: categoryId ? Number(categoryId) : null,
        barcode: barcode.trim() || null,
        image: null,
        variants: variants.length > 0 ? variants : undefined,
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'Add Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="SKU *" value={sku} onChange={(e) => setSku(e.target.value)} />
          <Input label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        </div>

        <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price *"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label="Cost Price"
            type="number"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900" style={{ borderBottom: '2px solid', borderImage: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-3)) 1', display: 'inline-block', paddingBottom: '2px' }}>Variants</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
              + Add Variant
            </Button>
          </div>

          {variants.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex gap-3 items-start mb-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <Input
                  placeholder="Name (e.g. Size)"
                  value={v.name}
                  onChange={(e) => updateVariant(i, 'name', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Value (e.g. M)"
                  value={v.value}
                  onChange={(e) => updateVariant(i, 'value', e.target.value)}
                />
              </div>
              <div className="w-24">
                <Input
                  placeholder="Stock"
                  type="number"
                  value={String(v.stock)}
                  onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))}
                />
              </div>
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="mt-6 text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Update' : 'Create'} Product
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
