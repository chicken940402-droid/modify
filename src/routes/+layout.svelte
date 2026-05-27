<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { uiTheme } from '$lib/course/uiTheme.svelte';
	import { userState } from '$lib/course/userState.svelte';

	let { children } = $props();

	onMount(() => {
		void userState.fetchProfile();
	});
</script>

<div class={uiTheme.current === 'classic' ? 'bg-classic-lab' : 'min-h-screen bg-[#876D5A]'}>
	{#if uiTheme.current === 'pixel'}
		<div class="pixel-frame"></div>
	{/if}

	{@render children()}
</div>
