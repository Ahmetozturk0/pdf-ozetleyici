'use server';

import { signIn, signOut } from '@/auth';
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
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function register(prevState: string | undefined, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Register.',
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
            message: 'Database Error: Failed to Create User. Email might actally exist.',
        };
    }

    // Redirect or return success for client handling
    return { success: true };
}

export async function handleSignOut() {
    await signOut({ redirectTo: '/login' });
}


