"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createIdeaAction } from "@/server/actions/projects-actions";

export function IdeaCaptureForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length === 0) return;
    startTransition(async () => {
      try {
        await createIdeaAction({
          content: content.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        });
        toast({ title: "Idea guardada." });
        setContent("");
        setTags("");
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo guardar la idea",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="idea-content">Nueva idea</Label>
        <Textarea
          id="idea-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Crear un juego de terror en Unity con..."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="idea-tags">Etiquetas (separadas por coma)</Label>
        <Input
          id="idea-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="juegos, unity"
        />
      </div>
      <Button type="submit" size="sm" className="self-start" disabled={isPending || content.trim().length === 0}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}
        Guardar idea
      </Button>
    </form>
  );
}
