'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { createUser } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const RegisterSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Geçersiz e-posta veya şifre.';
                default:
                    return 'Bir hata oluştu.';
            }
        }
        throw error;
    }
}

export async function register(prevState: { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Lütfen tüm alanları doğru şekilde doldurun.',
        };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await createUser({
            id: uuidv4(),
            email,
            password: hashedPassword,
            name,
        });
    } catch (error) {
        console.error('Registration error:', error);
        return {
            message: 'Veritabanı hatası: Kullanıcı oluşturulamadı. Bu e-posta adresi zaten kayıtlı olabilir.',
        };
    }

    // Redirect or return success for client handling
    return { success: true };
}

