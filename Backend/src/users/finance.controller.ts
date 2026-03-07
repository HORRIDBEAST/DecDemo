import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  
  @Get('news')
  @Public()
  @ApiOperation({ summary: 'Search finance news via Tavily' })
  @ApiQuery({ name: 'query', required: true, description: 'Search query for finance news' })
  async getFinanceNews(@Query('query') query: string) {
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    
    if (!TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY not configured');
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: query,
          search_depth: 'basic',
          include_images: true, 
          include_answer: false,
          max_results: 12,
        }),
      });

      const data = await response.json();
      const images = data.images || []; // ✅ Extract global images list

      const results = (data.results || []).map((result: any, index: number) => {
        // ✅ Strategy: Use specific result image -> Global image list -> Unsplash fallback
        // Using Unsplash source for nicer random finance images based on query keywords
        const keyword = query.split(' ')[0] || 'finance';
        const fallbackImage = `https://source.unsplash.com/400x200/?${keyword},finance&sig=${index}`;

        return {
            title: result.title,
            url: result.url,
            content: result.content || result.snippet || 'No description available',
            // ✅ Tavily results don't always have 'image_url' inside the result object.
            // We use the parallel 'images' array if available, or fallback to Unsplash.
            image_url: images[index] || fallbackImage,
            score: result.score,
        };
      });

      return results;
    } catch (error) {
      console.error('Tavily API Error:', error);
      return [];
    }
  }
}