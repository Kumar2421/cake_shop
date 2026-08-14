"use client";

import { useState } from "react";
import { type CategoryRow } from "@/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryFormProps {
  category: CategoryRow | null;
  allCategories: CategoryRow[];
  onSave: (data: {
    name: string;
    slug: string;
    parentId: number | null;
    routeSegment: string | null;
    imageUrl: string | null;
    position: number;
    isActive: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({
  category,
  allCategories,
  onSave,
  onCancel,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    parentId: category?.parent_id?.toString() || "",
    routeSegment: category?.route_segment || "",
    imageUrl: category?.image_url || "",
    position: category?.position ?? 0,
    isActive: category?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        name: formData.name,
        slug: formData.slug,
        parentId: formData.parentId ? parseInt(formData.parentId, 10) : null,
        routeSegment: formData.routeSegment || null,
        imageUrl: formData.imageUrl || null,
        position: formData.position,
        isActive: formData.isActive,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter out the current category from parent options to prevent self-nesting
  const parentOptions = allCategories.filter((c) => c.id !== category?.id);

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Create Category"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs font-medium">
              Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Cakes"
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <Label htmlFor="slug" className="text-xs font-medium">
              Slug *
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., cakes"
              required
            />
          </div>

          {/* Parent Category */}
          <div className="space-y-1">
            <Label htmlFor="parent" className="text-xs font-medium">
              Parent Category
            </Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) => value !== null && setFormData({ ...formData, parentId: value })}
            >
              <SelectTrigger id="parent">
                <SelectValue placeholder="None (top-level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (top-level)</SelectItem>
                {parentOptions.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Route Segment */}
          <div className="space-y-1">
            <Label htmlFor="route" className="text-xs font-medium">
              Route Segment
            </Label>
            <Input
              id="route"
              value={formData.routeSegment || ""}
              onChange={(e) => setFormData({ ...formData, routeSegment: e.target.value })}
              placeholder="e.g., chocolate-cakes"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1">
            <Label htmlFor="image" className="text-xs font-medium">
              Image URL
            </Label>
            <Input
              id="image"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Position */}
          <div className="space-y-1">
            <Label htmlFor="position" className="text-xs font-medium">
              Position
            </Label>
            <Input
              id="position"
              type="number"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value, 10) })}
              min="0"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active" className="text-xs font-medium">
              Active
            </Label>
            <Switch
              id="active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          {/* Form Actions */}
          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
