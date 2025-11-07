import { api } from '@/services/api';
import { useApiVersionStore } from '@/shared/stores/apiVersion';
import type { RevaluationPreviewResult } from '../types';

class AssetRevaluationService {
  getPreview(meetingId: string): Promise<RevaluationPreviewResult> {
    // El mapeo automático manejará la conversión a v2/meetings/:id/revaluation en v2
    return api.get(`/meetings/${meetingId}/revaluation/preview`);
  }

  execute(meetingId: string): Promise<RevaluationPreviewResult> {
    const apiVersionStore = useApiVersionStore();
    
    // En v2, usar PATCH con el endpoint v2, en v1 usar POST con el endpoint v1
    if (apiVersionStore.isV2) {
      return api.patch(`/v2/meetings/${meetingId}/revaluation/confirm`, {});
    } else {
    return api.post(`/meetings/${meetingId}/revaluation`, {});
    }
  }
}

export const assetRevaluationService = new AssetRevaluationService(); 