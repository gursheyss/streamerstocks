<script lang="ts">
    import { onMount } from 'svelte';
    import { createClient } from '@supabase/supabase-js';
    import { PUBLIC_SUPABASE_ANON_KEY,PUBLIC_SUPABASE_URL } from '$env/static/public';
    import type { NewsItem } from '$lib/types'; // Import the NewsItem interface

    let news: NewsItem[] = [];

    onMount(async () => {
      const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

      try {
        let { data, error } = await supabase
          .from('news')
          .select('message'); // Only select the 'message' column

        if (error) {
          throw error;
        }

        news = data || []; // Use the data directly as it's an array of strings
      } catch (error) {
        console.error('Error fetching news:', error);
        news = [];
      }
    });
  </script>

  <h1>News</h1>

  {#if news.length > 0}
    <ul>
      {#each news as item}
        <li>{item.message}</li>
      {/each}
    </ul>
  {:else}
    <p>Loading news...</p>
  {/if}