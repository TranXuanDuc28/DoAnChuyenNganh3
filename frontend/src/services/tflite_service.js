/**
 * TFLite Service (Tạm thời vô hiệu hóa cho Expo Go trên iPhone)
 * Khi nào bạn có Development Build hoặc máy Mac, chúng ta sẽ bật lại sau.
 */

class TFLiteService {
    constructor() {
        this.model = null;
    }

    async init() {
        console.log("TFLite Offline Mode is disabled for Expo Go compatibility.");
    }

    runInference(inputData) {
        return null;
    }
}

export const tfliteService = new TFLiteService();
