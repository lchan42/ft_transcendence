import { PrismaClient } from '@prisma/client';
import { PassportStatic } from 'passport';
import { Fortytwo_dto } from 'src/auth/dto';

const prisma = new PrismaClient();
export function configurePassport(passport: PassportStatic) {
  passport.serializeUser((user: Fortytwo_dto, done) => {
    console.log('Serializing user:', user.id, user.login);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    console.log('Deserializing user ID:', id);
    try {
      const user = await prisma.user.findUnique({
        where: {
          fortytwo_id: id,
        },
      });
      done(null, user); // 'user' sera disponible dans 'req.user'
    } catch (error) {
      done(error, null);
    }
  });
}
