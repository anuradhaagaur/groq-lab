import { PromptAnalysisResult, PromptClassificationType, PromptExample } from '../types/index';

interface DetectedBlock {
  input: string;
  output: string;
  raw: string;
  patternName: string;
}

/**
 * Robust structural Prompt Type Analyzer.
 * Examines prompt content for true input-output demonstrations vs ordinary text, requirements, or code snippets.
 */
export function analyzePrompt(promptText: string, systemPrompt: string = ''): PromptAnalysisResult {
  const fullText = `${systemPrompt}\n${promptText}`.trim();

  if (!fullText) {
    return {
      type: 'ZERO-SHOT',
      exampleCount: 0,
      headline: 'Zero-Shot Prompt',
      reasoning: 'The prompt is empty or contains no instructions or examples.',
      detectedExamples: [],
      confidence: 'high',
      structuralPatternsDetected: [],
      recommendation: 'Add your instructions or task description.',
    };
  }

  // Collection of detected verified example blocks
  const detectedBlocks: DetectedBlock[] = [];
  const structuralPatterns: string[] = [];

  // 1. Check for Explicit Keyed Demonstration Patterns
  // Pattern 1A: Input / Output or In / Out
  const inputOutputRegex = /(?:(?:^|\n)(?:###?\s*)?(?:Example\s*\d*[:.-]?\s*)?(?:Input|In|Prompt|Text|Source|Sentence|Query)[:\s]+([\s\S]*?)(?:^|\n)(?:Output|Out|Response|Completion|Result|Classification|Label|Sentiment|Target)[:\s]+([\s\S]*?))(?=(?:^|\n)(?:###?\s*)?(?:Example\s*\d*[:.-]?\s*)?(?:Input|In|Prompt|Text|Source|Sentence|Query)[:\s]+|(?:^|\n)(?:Now|Task|Test|Actual|New|User|Question|Current)[:\s]+|$)/gim;

  let match: RegExpExecArray | null;
  while ((match = inputOutputRegex.exec(promptText)) !== null) {
    const rawMatch = match[0].trim();
    const inputContent = match[1]?.trim() || '';
    const outputContent = match[2]?.trim() || '';

    // Verify both input and output have meaningful content and aren't just empty labels
    if (inputContent.length > 0 && outputContent.length > 0 && inputContent.length < 2000 && outputContent.length < 2000) {
      detectedBlocks.push({
        input: inputContent,
        output: outputContent,
        raw: rawMatch,
        patternName: 'Input/Output Keyed Pair',
      });
    }
  }

  if (detectedBlocks.length > 0) {
    structuralPatterns.push('Keyed Input/Output Demonstration');
  }

  // Pattern 1B: Question / Answer (Q: ... A: ...) worked examples
  // We must ensure the Answer is provided (worked example), not just an unanswered list of questions!
  if (detectedBlocks.length === 0) {
    const qaRegex = /(?:(?:^|\n)(?:###?\s*)?(?:Example\s*\d*[:.-]?\s*)?(?:Q|Question)[:\s]+([\s\S]*?)(?:^|\n)(?:A|Answer)[:\s]+([\s\S]*?))(?=(?:^|\n)(?:###?\s*)?(?:Example\s*\d*[:.-]?\s*)?(?:Q|Question)[:\s]+|(?:^|\n)(?:Now|Task|Test|Actual|New|Q|Question)[:\s]+|$)/gim;

    while ((match = qaRegex.exec(promptText)) !== null) {
      const rawMatch = match[0].trim();
      const qContent = match[1]?.trim() || '';
      const aContent = match[2]?.trim() || '';

      if (qContent.length > 0 && aContent.length > 0 && !aContent.toLowerCase().startsWith('?') && qContent.length < 1500) {
        detectedBlocks.push({
          input: qContent,
          output: aContent,
          raw: rawMatch,
          patternName: 'Question/Answer Demonstration',
        });
      }
    }

    if (detectedBlocks.length > 0) {
      structuralPatterns.push('Q&A Worked Examples');
    }
  }

  // Pattern 1C: Transformation Arrow pairs (e.g. "happy" -> "positive" or "good" => "+1")
  if (detectedBlocks.length === 0) {
    const arrowRegex = /^[ \t]*(?:[-*•]|\d+\.)?[ \t]*(["'`][^"'`\n]+["'`]|[^:\n->=>]+)[ \t]*(?:->|=>|→|⟶)[ \t]*(["'`][^"'`\n]+["'`]|.+)$/gm;
    const arrowMatches: DetectedBlock[] = [];

    while ((match = arrowRegex.exec(promptText)) !== null) {
      const left = match[1]?.trim().replace(/^["'`]|["'`]$/g, '') || '';
      const right = match[2]?.trim().replace(/^["'`]|["'`]$/g, '') || '';

      // Skip markdown links or obvious explanatory arrows
      if (left && right && !left.startsWith('[') && left.length < 200 && right.length < 200) {
        arrowMatches.push({
          input: left,
          output: right,
          raw: match[0].trim(),
          patternName: 'Arrow Transformation Demonstration',
        });
      }
    }

    // Only count if there are clear demonstration items and not just a single workflow flowchart
    if (arrowMatches.length >= 1) {
      detectedBlocks.push(...arrowMatches);
      structuralPatterns.push('Arrow Transformation Mapping');
    }
  }

  // Pattern 1D: Explicit "Example 1:", "Example 2:" blocks with distinct internal answers/transformations
  if (detectedBlocks.length === 0) {
    const numberedExampleRegex = /(?:(?:^|\n)(?:###?\s*)?Example\s*(\d+)[:.-]?\s*([\s\S]*?))(?=(?:^|\n)(?:###?\s*)?Example\s*\d+[:.-]?|$)/gim;
    const exampleSections: DetectedBlock[] = [];

    while ((match = numberedExampleRegex.exec(promptText)) !== null) {
      const content = match[2]?.trim() || '';
      // Check if this example section actually contains an input and output or demonstrated solution
      if (content.length > 15) {
        const hasSubOutput = /(?:Output|Answer|Result|Label|Solution|=>|->|:)/i.test(content);
        if (hasSubOutput) {
          const parts = content.split(/(?:\n(?:Output|Answer|Result|Label|Solution)[:\s]+|=>|->)/i);
          exampleSections.push({
            input: parts[0]?.trim() || content.slice(0, 100),
            output: parts[1]?.trim() || 'Demonstrated solution',
            raw: match[0].trim(),
            patternName: 'Numbered Example Section',
          });
        }
      }
    }

    if (exampleSections.length > 0) {
      detectedBlocks.push(...exampleSections);
      structuralPatterns.push('Numbered Example Demonstrations');
    }
  }

  // 2. Check for Ambiguity / False Positives / Mentions
  // E.g., someone wrote "For example: ..." or "Here is an example:" but without an answer or structured output.
  const mentionsExample = /\b(?:example|examples|e\.g\.|sample|demonstration|instance)\b/i.test(promptText);
  const mentionsQuestionsOnly = /(?:Q\d*:|\d+\.\s+What|\d+\.\s+How|\d+\.\s+Why)/i.test(promptText) && !/(?:A\d*:|Answer:)/i.test(promptText);
  const isCodeExplanationOnly = /```[\s\S]*?```/i.test(promptText) && !/(?:Input|Output|Expected|Example|Q:|A:)/i.test(promptText);

  // Filter out any false positive where detectedBlocks contains the entire prompt verbatim as a single block
  const validBlocks = detectedBlocks.filter(b => b.input.length > 0 && b.output.length > 0 && b.raw.length < promptText.length * 0.95);

  const count = validBlocks.length;
  const promptExamples: PromptExample[] = validBlocks.map((b, idx) => ({
    label: `Example #${idx + 1} (${b.patternName})`,
    input: b.input,
    output: b.output,
    rawSnippet: b.raw.length > 250 ? b.raw.slice(0, 250) + '...' : b.raw,
  }));

  // Classification Logic
  let type: PromptClassificationType;
  let headline: string;
  let reasoning: string;
  let confidence: 'high' | 'medium' | 'low' = 'high';
  let recommendation: string = '';

  if (count === 0) {
    if (mentionsExample && !mentionsQuestionsOnly && !isCodeExplanationOnly && promptText.length > 40) {
      // Prompt mentions "example" or "sample" but failed to parse into explicit paired worked demonstrations
      // Could be an informal or ambiguous example (e.g., "For example write in a funny tone")
      const isInformalStylisticExample = /for example,?\s+(?:you\s+(?:can|could)|write|use|focus|make)/i.test(promptText);
      if (isInformalStylisticExample) {
        type = 'ZERO-SHOT';
        headline = 'Zero-Shot Prompt (Stylistic Reference)';
        reasoning = 'The prompt mentions "for example" to illustrate style or requirements, but contains no worked task demonstrations showing expected input-output transformations.';
        confidence = 'high';
        recommendation = 'If you want the model to follow a strict format, provide 1 or more worked input-output examples.';
      } else {
        type = 'UNCLEAR';
        headline = 'Ambiguous Example Structure';
        reasoning = 'The prompt contains references to examples or sample cues, but no distinct input-output pairs or complete task demonstrations could be reliably parsed.';
        confidence = 'medium';
        recommendation = 'Format examples with explicit labels like "Input: ... Output: ..." to convert this into a clear Few-shot prompt.';
      }
    } else if (mentionsQuestionsOnly) {
      type = 'ZERO-SHOT';
      headline = 'Zero-Shot Prompt (Multiple Queries)';
      reasoning = 'The prompt contains multiple questions or bullet points, but no answered examples demonstrating how the task should be solved.';
      confidence = 'high';
      recommendation = 'This is a multi-part zero-shot prompt. To provide guidance, add worked answers for one of the questions.';
    } else {
      type = 'ZERO-SHOT';
      headline = 'Zero-Shot Prompt';
      reasoning = 'No worked input-output examples were detected. The model is asked to perform the task based purely on instructions and its pre-trained knowledge.';
      confidence = 'high';
      recommendation = 'Zero-shot is fast and token-efficient. If quality or format adherence varies, add 1-2 few-shot examples.';
    }
  } else if (count === 1) {
    type = 'ONE-SHOT';
    headline = 'One-Shot Prompt';
    reasoning = `1 worked task demonstration was detected (${validBlocks[0]?.patternName || 'demonstration pair'}). This gives the model a concrete reference for output format and style.`;
    confidence = 'high';
    recommendation = 'One-shot prompting is great for anchoring style and JSON/formatting schemas without consuming excessive context tokens.';
  } else {
    type = 'FEW-SHOT';
    headline = `Few-Shot Prompt (${count} Examples)`;
    reasoning = `${count} distinct worked input-output demonstrations were detected (${structuralPatterns.join(', ')}). This conditions the model on the exact transformation pattern.`;
    confidence = 'high';
    recommendation = 'Few-shot prompting significantly increases consistency on complex reasoning, classification, and strict schema adherence.';
  }

  return {
    type,
    exampleCount: count,
    headline,
    reasoning,
    detectedExamples: promptExamples,
    confidence,
    structuralPatternsDetected: structuralPatterns,
    recommendation,
  };
}

/**
 * Quick token estimator (approx 4 chars per token for English text)
 * Marked clearly as an estimate.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Standard heuristic: ~3.8 to 4 chars per token
  return Math.ceil(text.length / 3.8);
}
