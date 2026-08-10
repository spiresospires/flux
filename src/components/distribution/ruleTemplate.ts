// Factory for a blank AD rule, split out of RuleEditor.tsx so that module exports
// only its component. Mixing a component export with a helper export breaks React
// Fast Refresh (react-refresh/only-export-components); newRuleTemplate is a pure
// data factory, so it belongs in a plain module.
import type { AdRule } from '../../types/distribution';

export function newRuleTemplate(): AdRule {
  return {
    id: '',
    name: '',
    description: '',
    triggers: [{ kind: 'upload' }],
    conditions: [],
    assignments: [],
    priority: 50,
    enabled: true,
    updatedAt: '',
    updatedBy: '',
  };
}
