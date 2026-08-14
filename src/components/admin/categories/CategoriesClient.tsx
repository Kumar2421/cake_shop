"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Edit, Trash, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createCategory, updateCategory, deleteCategory, reorderCategory } from "@/lib/admin/categories";
import type { CategoryRow } from "@/types/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryForm } from "./CategoryForm";

interface CategoryNode extends CategoryRow {
  children: CategoryNode[];
}

export function CategoriesClient() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: number;
    name: string;
    error?: string;
  } | null>(null);

  // Load categories and build tree in memory
  const loadCategories = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch all categories in one query
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("position", { ascending: true });

      if (error) {
        toast.error("Failed to load categories");
        return;
      }

      // Build tree structure in memory
      const categoryMap = new Map<number, CategoryNode>();
      const roots: CategoryNode[] = [];

      // First pass: create all nodes
      (data || []).forEach((cat) => {
        const node: CategoryNode = {
          ...cat,
          children: [],
        };
        categoryMap.set(cat.id, node);
      });

      // Second pass: link parents and children
      (data || []).forEach((cat) => {
        const node = categoryMap.get(cat.id);
        if (!node) return;

        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          roots.push(node);
        }
      });

      // Sort children by position
      const sortChildren = (nodes: CategoryNode[]) => {
        nodes.forEach((node) => {
          node.children.sort((a, b) => a.position - b.position);
          sortChildren(node.children);
        });
      };
      sortChildren(roots);
      roots.sort((a, b) => a.position - b.position);

      setCategories(roots);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSaveCategory = async (data: {
    name: string;
    slug: string;
    parentId: number | null;
    routeSegment: string | null;
    imageUrl: string | null;
    position: number;
    isActive: boolean;
  }) => {
    if (editingCategory) {
      const result = await updateCategory(editingCategory.id, data);
      if (result.success) {
        toast.success("Category updated");
        setShowForm(false);
        setEditingCategory(null);
        loadCategories();
      } else {
        toast.error(result.message || "Failed to update category");
      }
    } else {
      const result = await createCategory(data);
      if (result.success) {
        toast.success("Category created");
        setShowForm(false);
        loadCategories();
      } else {
        toast.error(result.message || "Failed to create category");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!deleteConfirm) return;

    const result = await deleteCategory(id);
    if (result.success) {
      toast.success("Category deleted");
      setDeleteConfirm(null);
      loadCategories();
    } else {
      toast.error(result.message || "Failed to delete category");
      setDeleteConfirm({ id, name: deleteConfirm.name, error: result.message });
    }
  };

  const handleReorder = async (id: number, newPosition: number) => {
    if (newPosition < 0) return;

    const result = await reorderCategory(id, newPosition);
    if (result.success) {
      loadCategories();
    } else {
      toast.error(result.message || "Failed to reorder category");
    }
  };

  if (loading) {
    return <div className="text-sm text-ink-muted">Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add New Category Button */}
      <Button
        onClick={() => {
          setEditingCategory(null);
          setShowForm(true);
        }}
        className="gap-2"
      >
        <Plus className="size-4" />
        Add Category
      </Button>

      {/* Category Tree */}
      {categories.length > 0 ? (
        <div className="space-y-2">
          {categories.map((category) => (
            <CategoryTreeNode
              key={category.id}
              node={category}
              level={0}
              onEdit={(cat) => {
                setEditingCategory(cat);
                setShowForm(true);
              }}
              onDelete={(id, name) => {
                setDeleteConfirm({ id, name });
              }}
              onReorder={handleReorder}
              allCategories={categories}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="font-medium text-ink">No categories yet</p>
          <p className="mt-1 text-sm text-ink-muted">
            Click &quot;Add Category&quot; to create your first category.
          </p>
        </Card>
      )}

      {/* Category Form Dialog */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          allCategories={categories.flatMap((c) => [c, ...flattenCategories(c.children)])}
          onSave={handleSaveCategory}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <AlertDialog open={true} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.error ? (
                <div className="space-y-2">
                  <p>{deleteConfirm.error}</p>
                  <p className="text-xs text-ink-muted">
                    Please resolve the dependencies before deleting this category.
                  </p>
                </div>
              ) : (
                <p>
                  Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? This action cannot be
                  undone.
                </p>
              )}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {!deleteConfirm.error && (
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deleteConfirm.id)}
                >
                  Delete
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

interface CategoryTreeNodeProps {
  node: CategoryNode;
  level: number;
  onEdit: (category: CategoryRow) => void;
  onDelete: (id: number, name: string) => void;
  onReorder: (id: number, position: number) => void;
  allCategories: CategoryNode[];
}

function CategoryTreeNode({
  node,
  level,
  onEdit,
  onDelete,
  onReorder,
  allCategories,
}: CategoryTreeNodeProps) {
  return (
    <div>
      <div
        className="flex items-center justify-between rounded-lg border border-hairline bg-white p-4 hover:bg-background"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex-1">
          <div className="font-medium text-ink">{node.name}</div>
          <div className="text-xs text-ink-muted">{node.slug}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReorder(node.id, node.position - 1)}
            title="Move up"
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReorder(node.id, node.position + 1)}
            title="Move down"
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(node)}
            title="Edit"
          >
            <Edit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(node.id, node.name)}
            title="Delete"
          >
            <Trash className="size-4 text-brand-red-dark" />
          </Button>
        </div>
      </div>

      {/* Render children */}
      {node.children.length > 0 && (
        <div className="space-y-2">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={onReorder}
              allCategories={allCategories}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to flatten category tree
function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flattenCategories(node.children)]);
}
