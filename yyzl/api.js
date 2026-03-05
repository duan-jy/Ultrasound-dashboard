import { http } from 'msun-lib-ui';
const api = http.create({ baseURL: import.meta.env.VITE_PACS_COMMON_API });

/**
 * 根据登记ID获取智能体生成的诊断和所见
 * @param registrationId
 * @return {*}
 */
export const getIntelligentReportResult = registrationId => {
  return api.get('./ocr/getIntelligentReportResult', {
    params: {
      registrationId
    }
  });
};
export const speechOptimize = param => {
  return api.post('./ocr/speechOptimize', param);
};

export const intelligentReportGeneration = (param) => {
  return api.post('./ocr/intelligentReportGeneration', param);
};

/**
 * 获取生成的患者画像信息
 * @param registrationId
 * @return {*}
 */
export const getPatientPortraitGeneration = registrationId => {
  return api.get('./intelligent/getPatientPortraitGeneration', {
    params: {
      registrationId
    }
  });
};
// 重新修改报告后的所见和诊断
export const getIntelligentModifyReportResult = registrationId => {
  return api.get('./intelligent/getIntelligentModifyReportResult', {
    params: {
      registrationId
    }
  });
};
/**
 * 根据登记ID触发患者画像生成(只触发患者画像生成)
 * @param registrationId
 * @return {*}
 */
export const patientPortraitGeneration = registrationId => {
  return api.get('./intelligent/patientPortraitGeneration', {
    params: {
      registrationId
    }
  });
};

export const saveUsIntelligentAgentLog = (param) => {
  return api.post('./intelligent/saveUsIntelligentAgentLog',param);
};


export const longSpeechChat = (param) => {
  return api.post('./ocr/longSpeechChat', param, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
export const uploadImg = param => {
  return api.post('./ocr/processOcr', param, {
    responseType: 'blob'
  });
};
export const getAiQualityControlResult = param => {
  return api.post('./intelligent/getAiQualityControlResult', param);
};


