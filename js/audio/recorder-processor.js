class RecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffers = [];
    }
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            // Copy Float32 data to avoid referencing issues
            const left = new Float32Array(input[0]);
            const right = new Float32Array(input[1] || input[0]); // fallback mono to stereo
            this.port.postMessage([left, right], [left.buffer, right.buffer]);
        }
        return true;
    }
}
registerProcessor('recorder-processor', RecorderProcessor);
