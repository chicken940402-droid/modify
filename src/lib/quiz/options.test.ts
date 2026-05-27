import { describe, expect, it } from 'vitest';
import { normalizeQuizOptions } from './options';

describe('normalizeQuizOptions', () => {
	it('normalizes Gemini option records to the canonical shape', () => {
		expect(
			normalizeQuizOptions([
				{ key: 'A', text: '60 m', image_url: null },
				{ key: 'B', text: '60 cm', image_url: ' https://example.com/b.png ' }
			])
		).toEqual([
			{ id: 'A', text: '60 m', imageUrl: null },
			{ id: 'B', text: '60 cm', imageUrl: 'https://example.com/b.png' }
		]);
	});

	it('keeps old object and string option shapes readable', () => {
		expect(normalizeQuizOptions({ A: 'left', B: { text: 'right', imageUrl: null } })).toEqual([
			{ id: 'A', text: 'left', imageUrl: null },
			{ id: 'B', text: 'right', imageUrl: null }
		]);

		expect(normalizeQuizOptions(['one', 'two'])).toEqual([
			{ id: 'A', text: 'one', imageUrl: null },
			{ id: 'B', text: 'two', imageUrl: null }
		]);
	});
});
