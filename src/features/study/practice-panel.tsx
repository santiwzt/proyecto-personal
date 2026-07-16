"use client";

import * as React from "react";
import { ChevronRight, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { generateQuestionsAction, gradeAnswerAction } from "@/server/actions/practice-actions";
import type { PracticeQuestion } from "@/types/domain";

interface GradeResult {
  isCorrect: boolean;
  feedback: string;
  firstErrorHint: string | null;
}

export function PracticePanel({
  topicId,
  topicName,
  subjectFiles,
}: {
  topicId: string;
  topicName: string;
  subjectFiles: { id: string; name: string }[];
}) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isGrading, setIsGrading] = React.useState(false);
  const [questions, setQuestions] = React.useState<PracticeQuestion[] | null>(null);
  const [index, setIndex] = React.useState(0);
  const [answer, setAnswer] = React.useState("");
  const [result, setResult] = React.useState<GradeResult | null>(null);
  const [showExplanation, setShowExplanation] = React.useState(false);

  const current = questions?.[index] ?? null;

  async function handleStart() {
    setIsGenerating(true);
    try {
      const { questions: generated } = await generateQuestionsAction({
        subjectId: null,
        topicId,
        fileIds: subjectFiles.map((f) => f.id),
        difficulty: "media",
        count: 5,
        kind: "mixto",
      });
      setQuestions(generated);
      setIndex(0);
      setResult(null);
      setAnswer("");
      setShowExplanation(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo generar la practica",
        description:
          error instanceof Error
            ? error.message
            : `Subi material de "${topicName}" en Archivos para poder practicar este tema.`,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAnswer(text: string) {
    if (!current || isGrading) return;
    setIsGrading(true);
    try {
      const attempt = await gradeAnswerAction({ questionId: current.id, answerText: text });
      setResult({ isCorrect: attempt.isCorrect, feedback: attempt.feedback, firstErrorHint: attempt.firstErrorHint });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo corregir la respuesta",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsGrading(false);
    }
  }

  function handleNext() {
    setIndex((i) => i + 1);
    setAnswer("");
    setResult(null);
    setShowExplanation(false);
  }

  if (!questions) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={handleStart} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
        Practicar este tema
      </Button>
    );
  }

  if (!current) {
    return (
      <Card className="bg-muted/40">
        <CardContent className="py-4 text-sm">
          Terminaste esta tanda de practica de &quot;{topicName}&quot;.{" "}
          <Button type="button" size="sm" variant="link" className="h-auto p-0" onClick={() => setQuestions(null)}>
            Practicar de nuevo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>
            Pregunta {index + 1} de {questions.length}
          </span>
          <Badge variant="outline">{current.difficulty}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{current.prompt}</p>

        {!result ? (
          current.kind === "verdadero_falso" ? (
            <div className="flex gap-2">
              {(current.options ?? ["Verdadero", "Falso"]).map((opt) => (
                <Button key={opt} type="button" size="sm" variant="outline" disabled={isGrading} onClick={() => handleAnswer(opt)}>
                  {isGrading && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {opt}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                placeholder="Escribi tu respuesta..."
              />
              <Button type="button" size="sm" onClick={() => handleAnswer(answer)} disabled={isGrading || !answer.trim()}>
                {isGrading && <Loader2 className="animate-spin" aria-hidden="true" />}
                Corregir
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-2 rounded-md border border-border bg-background p-3">
            <p className={result.isCorrect ? "text-sm font-medium text-emerald-600" : "text-sm font-medium text-destructive"}>
              {result.isCorrect ? "¡Correcto!" : "No es correcto todavia."}
            </p>
            <p className="text-sm">{result.feedback}</p>
            {!result.isCorrect && result.firstErrorHint && (
              <p className="text-sm text-muted-foreground">Pista: {result.firstErrorHint}</p>
            )}
            {!showExplanation ? (
              <Button type="button" size="sm" variant="link" className="h-auto p-0" onClick={() => setShowExplanation(true)}>
                Ver explicacion completa
              </Button>
            ) : (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Respuesta esperada:</span> {current.expectedAnswer}
                </p>
                <p>{current.explanation}</p>
              </div>
            )}
            <div>
              <Button type="button" size="sm" onClick={handleNext}>
                Siguiente <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
