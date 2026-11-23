import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PublicFeaturedQueryDto } from './public-featured-query.dto';

describe('PublicFeaturedQueryDto', () => {
  it('accepts a valid numeric limit', async () => {
    const dto = plainToInstance(PublicFeaturedQueryDto, { limit: '6' }, {
      enableImplicitConversion: true,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects limits outside the allowed range', async () => {
    const tooSmall = plainToInstance(PublicFeaturedQueryDto, { limit: 0 });
    const tooLarge = plainToInstance(PublicFeaturedQueryDto, { limit: 13 });
    const notANumber = plainToInstance(PublicFeaturedQueryDto, { limit: 'latest' });

    await expect(validate(tooSmall)).resolves.toHaveLength(1);
    await expect(validate(tooLarge)).resolves.toHaveLength(1);
    await expect(validate(notANumber)).resolves.toHaveLength(1);
  });
});
