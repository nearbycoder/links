import { ActionPanel, Action, Form, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { useFetcher } from "../utils/useFetcher";
import { BASE_URL } from "../constants";

type Category = {
  id: string;
  name: string;
  description: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type Tag = {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export default function Command() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories and tags for dropdowns
  const { data: categories } = useFetcher<Category[]>(`/api/categories`);
  const { data: tags } = useFetcher<Tag[]>(`/api/tags`);

  const handleSubmit = async () => {
    if (!title.trim() || !url.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Title and URL are required",
      });
      return;
    }

    setIsLoading(true);

    try {
      const preferences = getPreferenceValues<{ apiKey: string }>();

      const response = await fetch(`${BASE_URL}/api/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": preferences.apiKey,
        },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          tagIds: tagIds.length > 0 ? tagIds : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const newLink = await response.json();

      await showToast({
        style: Toast.Style.Success,
        title: "Success",
        message: `Link "${newLink.title}" created successfully`,
      });

      // Reset form
      setTitle("");
      setUrl("");
      setDescription("");
      setCategoryId("");
      setTagIds([]);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to create link",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Link" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="Enter link title"
        value={title}
        onChange={setTitle}
        autoFocus
      />
      <Form.TextField id="url" title="URL" placeholder="https://example.com" value={url} onChange={setUrl} />
      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Enter link description (optional)"
        value={description}
        onChange={setDescription}
      />
      <Form.Dropdown id="category" title="Category" value={categoryId} onChange={setCategoryId}>
        <Form.Dropdown.Item value="" title="No Category" />
        {categories?.map((category) => (
          <Form.Dropdown.Item key={category.id} value={category.id} title={category.name} />
        ))}
      </Form.Dropdown>
      <Form.TagPicker id="tags" title="Tags" value={tagIds} onChange={setTagIds} placeholder="Select tags (optional)">
        {tags?.map((tag) => (
          <Form.TagPicker.Item key={tag.id} value={tag.id} title={tag.name} />
        ))}
      </Form.TagPicker>
    </Form>
  );
}
