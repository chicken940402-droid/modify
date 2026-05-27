export type NormalizedQuizOption = {
	id: string;
	text: string;
	imageUrl: string | null;
};

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

function normalizeOptionText(value: unknown) {
	if (typeof value !== 'string') return String(value ?? '').trim();
	return value.trim();
}

function normalizeOptionImageUrl(record: Record<string, unknown>) {
	const value = record.imageUrl ?? record.image_url ?? null;
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeRecordOption(record: Record<string, unknown>, fallbackId: string) {
	const id =
		normalizeOptionText(record.id) ||
		normalizeOptionText(record.key) ||
		normalizeOptionText(record.label) ||
		fallbackId;
	const text =
		normalizeOptionText(record.text) ||
		normalizeOptionText(record.value) ||
		normalizeOptionText(record.label) ||
		id;

	return {
		id,
		text,
		imageUrl: normalizeOptionImageUrl(record)
	};
}

export function normalizeQuizOptions(rawOptions: unknown): NormalizedQuizOption[] {
	if (Array.isArray(rawOptions)) {
		return rawOptions.map((option, index) => {
			const fallbackId = optionLabels[index] ?? String(index + 1);

			if (typeof option === 'string') {
				return { id: fallbackId, text: option.trim(), imageUrl: null };
			}

			if (option && typeof option === 'object') {
				return normalizeRecordOption(option as Record<string, unknown>, fallbackId);
			}

			return {
				id: fallbackId,
				text: normalizeOptionText(option),
				imageUrl: null
			};
		});
	}

	if (rawOptions && typeof rawOptions === 'object') {
		return Object.entries(rawOptions as Record<string, unknown>).map(([id, value]) => {
			if (value && typeof value === 'object') {
				return normalizeRecordOption({ ...(value as Record<string, unknown>), id }, id);
			}

			return {
				id,
				text: normalizeOptionText(value),
				imageUrl: null
			};
		});
	}

	return [];
}
