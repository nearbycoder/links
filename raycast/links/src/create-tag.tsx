import { ActionPanel, Action, Form, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { BASE_URL } from "../constants";

export default function Command() {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Name is required",
      });
      return;
    }

    setIsLoading(true);

    try {
      const preferences = getPreferenceValues<{ apiKey: string }>();

      const response = await fetch(`${BASE_URL}/api/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": preferences.apiKey,
        },
        body: JSON.stringify({
          name: name.trim(),
          color: color.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const newTag = await response.json();

      await showToast({
        style: Toast.Style.Success,
        title: "Success",
        message: `Tag "${newTag.name}" created successfully`,
      });

      // Reset form
      setName("");
      setColor("");
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to create tag",
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
          <Action.SubmitForm title="Create Tag" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Name" placeholder="Enter tag name" value={name} onChange={setName} autoFocus />
      <Form.TextField
        id="color"
        title="Color"
        placeholder="Enter color (e.g., #FF5733 or red)"
        value={color}
        onChange={setColor}
      />
    </Form>
  );
}
