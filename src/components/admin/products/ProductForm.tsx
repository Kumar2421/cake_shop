"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Upload,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Star,
} from "lucide-react";
import {
  createProduct,
  updateProduct,
  deleteImage,
  getProductImageUploadUrl,
  createImageRecord,
} from "@/lib/admin/products";
import {
  type ProductWithRelations,
  type CategoryRow,
} from "@/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ProductImageDeleteDialog } from "./ProductImageDeleteDialog";

interface ProductFormProps {
  product?: ProductWithRelations;
  categories?: CategoryRow[] | null;
}

// Slug generation from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Variant {
  id?: number;
  weight_label: string;
  serving_label: string | null;
  price_rupees: number;
  sku: string | null;
  stock: number | null;
  is_active: boolean;
}

interface UploadingImage {
  file: File;
  progress: number;
}

export function ProductForm({
  product,
  categories = [],
}: ProductFormProps) {
  const isEdit = !!product;

  // Form state
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [categoryId, setCategoryId] = useState(
    product?.category_id?.toString() || "",
  );
  const [description, setDescription] = useState(product?.description || "");
  const [chefWord, setChefWord] = useState(product?.chef_word || "");
  const [basePriceRupees, setBasePriceRupees] = useState(
    product ? (product.base_price_paise / 100).toFixed(2) : "",
  );
  const [isEggless, setIsEggless] = useState(product?.is_eggless || false);
  const [isBestseller, setIsBestseller] = useState(
    product?.is_bestseller || false,
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [tag, setTag] = useState(product?.tag || "");
  const [flavour, setFlavour] = useState(product?.flavour || "");

  // Variants
  const [variants, setVariants] = useState<Variant[]>(
    product?.product_variants.map((v) => ({
      id: v.id,
      weight_label: v.weight_label,
      serving_label: v.serving_label,
      price_rupees: v.price_paise / 100,
      sku: v.sku,
      stock: v.stock,
      is_active: v.is_active,
    })) || [],
  );

  // Images
  const [images, setImages] = useState(product?.product_images || []);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Server action
  interface FormState {
    error?: string;
    fieldErrors?: Record<string, string>;
    success?: boolean;
  }

  const actionHandler = isEdit
    ? async (_prev: FormState, formData: FormData) => {
        return updateProduct(_prev, formData, product!.id);
      }
    : createProduct;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    actionHandler,
    {},
  );

  // Handle name change and auto-generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    // Only auto-generate slug if it's a new product or matches the old slug
    if (!isEdit || slug === generateSlug(product?.name || "")) {
      setSlug(generateSlug(newName));
    }
  };

  // Handle variant changes
  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string | number | boolean | null,
  ) => {
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: value,
    };
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        weight_label: "",
        serving_label: null,
        price_rupees: 0,
        sku: null,
        stock: null,
        is_active: true,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Image upload handling
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        continue;
      }

      // Add to uploading list
      setUploadingImages((prev) => [...prev, { file, progress: 0 }]);

      // Upload to Supabase
      try {
        const uploadUrlResult = await getProductImageUploadUrl(file.name);

        if (uploadUrlResult.error) {
          toast.error(`Failed to get upload URL: ${uploadUrlResult.error}`);
          setUploadingImages((prev) =>
            prev.filter((img) => img.file.name !== file.name),
          );
          continue;
        }

        // Upload using the signed URL
        const response = await fetch(uploadUrlResult.url!, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!response.ok) {
          toast.error(`Failed to upload ${file.name}`);
          setUploadingImages((prev) =>
            prev.filter((img) => img.file.name !== file.name),
          );
          continue;
        }

        // Get the public URL
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadUrlResult.path}`;

        // Create image record in database (only if editing a product)
        if (isEdit) {
          const recordResult = await createImageRecord(
            product!.id,
            publicUrl,
            file.name,
          );

          if (recordResult.error) {
            toast.error(`Failed to save image: ${recordResult.error}`);
          } else {
            toast.success("Image uploaded successfully");
            // Refetch images to show the new one
            setImages((prev) => [
              ...prev,
              {
                id: 0, // Placeholder
                product_id: product!.id,
                url: publicUrl,
                alt: file.name,
                position: prev.length,
              },
            ]);
          }
        } else {
          // For new products, just store the URL locally and it will be saved with the product
          toast.success("Image uploaded successfully");
          setImages((prev) => [
            ...prev,
            {
              id: 0, // Placeholder
              product_id: 0, // Will be set after product creation
              url: publicUrl,
              alt: file.name,
              position: prev.length,
            },
          ]);
        }

        setUploadingImages((prev) =>
          prev.filter((img) => img.file.name !== file.name),
        );
      } catch (error) {
        toast.error(
          `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setUploadingImages((prev) =>
          prev.filter((img) => img.file.name !== file.name),
        );
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (imageId: number) => {
    const result = await deleteImage(imageId);

    if (result.success) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted");
    } else {
      toast.error(result.error || "Failed to delete image");
    }
  };

  // Build FormData for submission
  const handleSubmit = async (formData: FormData) => {
    // Add variants to FormData
    variants.forEach((variant, index) => {
      formData.set(`variants.${index}.weight_label`, variant.weight_label);
      formData.set(
        `variants.${index}.serving_label`,
        variant.serving_label || "",
      );
      formData.set(`variants.${index}.price_rupees`, variant.price_rupees.toString());
      formData.set(`variants.${index}.sku`, variant.sku || "");
      formData.set(`variants.${index}.stock`, variant.stock?.toString() || "");
      formData.set(
        `variants.${index}.is_active`,
        variant.is_active ? "on" : "",
      );
      if (variant.id) {
        formData.set(`variants.${index}.id`, variant.id.toString());
      }
    });

    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Error alert */}
      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">{state.error}</div>
        </div>
      )}

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Basic information about the product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Black Forest Cake"
                className={state?.fieldErrors?.name ? "border-destructive" : ""}
              />
              {state?.fieldErrors?.name && (
                <p className="mt-1 text-xs text-destructive">
                  {state.fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="black-forest-cake"
                className={state?.fieldErrors?.slug ? "border-destructive" : ""}
              />
              {state?.fieldErrors?.slug && (
                <p className="mt-1 text-xs text-destructive">
                  {state.fieldErrors.slug}
                </p>
              )}
              <p className="mt-1 text-xs text-ink-muted">
                Changing this breaks existing links
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BFC-001"
                className={state?.fieldErrors?.sku ? "border-destructive" : ""}
              />
              {state?.fieldErrors?.sku && (
                <p className="mt-1 text-xs text-destructive">
                  {state.fieldErrors.sku}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="category_id" value={categoryId} />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="chef_word">Chef&apos;s Word</Label>
            <Textarea
              id="chef_word"
              name="chef_word"
              value={chefWord}
              onChange={(e) => setChefWord(e.target.value)}
              placeholder="Personal note from the chef..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="base_price">Base Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                ₹
              </span>
              <Input
                id="base_price"
                name="base_price_rupees"
                type="text"
                inputMode="decimal"
                value={basePriceRupees}
                onChange={(e) => setBasePriceRupees(e.target.value)}
                placeholder="0.00"
                className="pl-6"
              />
            </div>
            {state?.fieldErrors?.base_price_rupees && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.base_price_rupees}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attributes Card */}
      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="is_eggless">Eggless</Label>
            <Switch
              id="is_eggless"
              name="is_eggless"
              checked={isEggless}
              onCheckedChange={setIsEggless}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_bestseller">Bestseller</Label>
            <Switch
              id="is_bestseller"
              name="is_bestseller"
              checked={isBestseller}
              onCheckedChange={setIsBestseller}
            />
          </div>

          <div className="flex items-center justify-between border-t border-hairline pt-4">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              name="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="pt-4">
            <Label htmlFor="tag">Tag</Label>
            <Input
              id="tag"
              name="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Premium, Special"
            />
          </div>

          <div>
            <Label htmlFor="flavour">Flavour</Label>
            <Select value={flavour} onValueChange={(val) => setFlavour(val || "")}>
              <SelectTrigger id="flavour">
                <SelectValue placeholder="Select flavour" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="chocolate">Chocolate</SelectItem>
                <SelectItem value="vanilla">Vanilla</SelectItem>
                <SelectItem value="strawberry">Strawberry</SelectItem>
                <SelectItem value="red_velvet">Red Velvet</SelectItem>
                <SelectItem value="cheesecake">Cheesecake</SelectItem>
                <SelectItem value="carrot">Carrot</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="flavour" value={flavour} />
          </div>
        </CardContent>
      </Card>

      {/* Variants Card */}
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>At least one variant is required</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.fieldErrors?.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">{state.fieldErrors.error}</div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Weight Label</TableHead>
                  <TableHead>Serving Label</TableHead>
                  <TableHead>Price (₹)</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        value={variant.weight_label}
                        onChange={(e) =>
                          updateVariant(idx, "weight_label", e.target.value)
                        }
                        placeholder="e.g. 500g"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.serving_label || ""}
                        onChange={(e) =>
                          updateVariant(
                            idx,
                            "serving_label",
                            e.target.value || null,
                          )
                        }
                        placeholder="e.g. 4 serves"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={variant.price_rupees}
                        onChange={(e) =>
                          updateVariant(
                            idx,
                            "price_rupees",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="0.00"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku || ""}
                        onChange={(e) =>
                          updateVariant(idx, "sku", e.target.value || null)
                        }
                        placeholder="SKU"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.stock ?? ""}
                        onChange={(e) =>
                          updateVariant(
                            idx,
                            "stock",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                        placeholder="0"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={variant.is_active}
                        onCheckedChange={(checked) =>
                          updateVariant(idx, "is_active", checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-destructive hover:bg-destructive/10 rounded p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addVariant}
            className="gap-2"
          >
            <Plus className="size-4" />
            Add variant
          </Button>
        </CardContent>
      </Card>

      {/* Images Card */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>Product images for the catalog</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload zone */}
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-hairline bg-background p-8 text-center cursor-pointer transition-colors hover:border-brand-red hover:bg-brand-pink-tint/10">
            <Upload className="size-8 text-ink-muted" />
            <div>
              <p className="font-medium text-ink">Click to upload or drag and drop</p>
              <p className="text-xs text-ink-muted">
                PNG, JPG, WebP or AVIF up to 5MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>

          {/* Uploading progress */}
          {uploadingImages.length > 0 && (
            <div className="space-y-2">
              {uploadingImages.map((img) => (
                <div key={img.file.name} className="text-xs">
                  <p className="text-ink-muted">{img.file.name}</p>
                  <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-brand-red transition-all"
                      style={{ width: `${img.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Image grid */}
          {images.length > 0 && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img, idx) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border border-hairline">
                  <Image
                    src={img.url}
                    alt={img.alt || "Product image"}
                    width={200}
                    height={200}
                    className="aspect-square object-cover"
                  />

                  {idx === 0 && (
                    <div className="absolute top-1 left-1 rounded-full bg-brand-red p-1">
                      <Star className="size-3 fill-white text-white" />
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    {isEdit && (
                      <ProductImageDeleteDialog
                        onDelete={() => handleRemoveImage(img.id)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="sticky bottom-0 right-0 left-0 border-t border-hairline bg-white p-4 flex items-center justify-between gap-4">
        <Link href="/admin/products">
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="size-4" />
            Back
          </Button>
        </Link>

        <Button
          type="submit"
          disabled={isPending || variants.length === 0}
          className="gap-2"
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
              ? "Update product"
              : "Create product"}
        </Button>
      </div>
    </form>
  );
}
