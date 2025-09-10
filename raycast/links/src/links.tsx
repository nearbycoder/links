import { ActionPanel, Action, List, getPreferenceValues, Form, showToast, Toast } from "@raycast/api";
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

type Link = {
  id: string;
  title: string;
  url: string;
  description: string;
  favicon: string;
  isFavorite: boolean;
  categoryId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
  tags: { tag: Tag }[];
};

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch categories for the dropdown
  const { data: categories } = useFetcher<Category[]>(`/api/categories`);

  // Build the API URL with category filter
  const linksUrl =
    selectedCategory === "all"
      ? `/api/links?search=${searchText}`
      : `/api/links?categoryId=${selectedCategory}&search=${searchText}`;

  const { data, isLoading, revalidate } = useFetcher<Link[]>(linksUrl);

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by Category" value={selectedCategory} onChange={setSelectedCategory}>
          <List.Dropdown.Item key="all" title="All Categories" value="all" />
          {categories?.map((category) => (
            <List.Dropdown.Item key={category.id} title={category.name} value={category.id} />
          ))}
        </List.Dropdown>
      }
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search links..."
      filtering={{
        keepSectionOrder: true,
      }}
    >
      {data?.map((item: any) => {
        const accessories = [{ date: new Date(item.createdAt), tooltip: "Created At" }];

        return (
          <List.Item
            key={item.id}
            icon={item.favicon}
            title={item.title}
            subtitle={item.description}
            keywords={[
              ...item.tags.map(({ tag }: { tag: Tag }) => tag.name),
              item.category?.name || "",
              item.description || "",
            ]}
            accessories={
              item.category
                ? [
                    { tag: { value: item.category.name, color: item.category.color }, tooltip: "Category" },
                    ...accessories,
                  ]
                : [...accessories]
            }
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={item.url} />
                <Action.Push
                  title="Edit Link"
                  target={<EditLinkForm link={item} onUpdate={revalidate} />}
                  shortcut={{ modifiers: ["cmd"], key: "e" }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function EditLinkForm({ link, onUpdate }: { link: Link; onUpdate: () => void }) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [description, setDescription] = useState(link.description || "");
  const [categoryId, setCategoryId] = useState(link.categoryId || "");
  const [tagIds, setTagIds] = useState<string[]>(link.tags?.map((tagRelation) => tagRelation.tag.id) || []);
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

      const response = await fetch(`${BASE_URL}/api/links/${link.id}`, {
        method: "PUT",
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

      await showToast({
        style: Toast.Style.Success,
        title: "Success",
        message: `Link "${title}" updated successfully`,
      });

      // Refresh the links list
      onUpdate();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update link",
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
          <Action.SubmitForm title="Update Link" onSubmit={handleSubmit} />
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
