export type PolicySlug = 'shipping' | 'returns' | 'privacy' | 'terms';

export type PolicyDocument = {
  slug: PolicySlug;
  /** Publication state is owned by the store. Nothing is inferred from it. */
  published: boolean;
  updatedAt: string | null;
  /** Plain paragraphs approved by the store. Empty until they are supplied. */
  paragraphs: string[];
};

/**
 * Phase 1 has no approved legal copy. The screens keep a designed empty state
 * instead of fabricating shipping windows, return terms or legal text.
 */
export const policyDocuments: Record<PolicySlug, PolicyDocument> = {
  shipping: { slug: 'shipping', published: false, updatedAt: null, paragraphs: [] },
  returns: { slug: 'returns', published: false, updatedAt: null, paragraphs: [] },
  privacy: { slug: 'privacy', published: false, updatedAt: null, paragraphs: [] },
  terms: { slug: 'terms', published: false, updatedAt: null, paragraphs: [] },
};

export const policySlugs: PolicySlug[] = ['shipping', 'returns', 'privacy', 'terms'];

export function isPolicySlug(value: string): value is PolicySlug {
  return (policySlugs as string[]).includes(value);
}
