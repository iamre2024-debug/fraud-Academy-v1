const DEFAULT_ENDPOINT = '/api/luna-debrief';

export async function requestLunaApiCoaching({ activeCase, reviewPackage, deterministicDebrief, signal }) {
  if (!activeCase || !reviewPackage || !deterministicDebrief) return null;

  const response = await fetch(import.meta.env.VITE_LUNA_API_URL || DEFAULT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      caseId: activeCase.id,
      caseType: activeCase.type,
      allegation: activeCase.allegation,
      submittedDecision: reviewPackage.choice,
      confidence: reviewPackage.confidence,
      rationale: reviewPackage.reason || '',
      deterministicResult: {
        determinationMatched: deterministicDebrief.determinationMatched,
        expectedDetermination: deterministicDebrief.truthReveal?.correctDetermination || null,
        acceptedDeterminations: deterministicDebrief.truthReveal?.acceptedDeterminations || [],
        classification: deterministicDebrief.truthReveal?.classification || null,
        score: deterministicDebrief.score,
        strengths: deterministicDebrief.strengths,
        followUps: deterministicDebrief.followUps,
      },
      packageFacts: {
        completedTools: reviewPackage.completedTools || [],
        pinnedEvidence: reviewPackage.pinnedEvidence || [],
        noteSnapshot: reviewPackage.noteSnapshot || [],
        decisionIndicators: reviewPackage.decisionIndicators || [],
      },
    }),
  });

  if (!response.ok) throw new Error(`Luna API request failed (${response.status})`);
  const payload = await response.json();
  if (!payload || typeof payload.coachIntro !== 'string') throw new Error('Luna API returned an invalid coaching payload');
  return payload;
}
