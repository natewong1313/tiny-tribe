import { z } from "zod";

export const usernameSchema = z
	.string()
	.min(1, "Username is required")
	.refine((val) => !val.endsWith("_"), {
		message: "Username cannot end with underscore",
	});

export type UsernameSchema = z.infer<typeof usernameSchema>;

export interface UsernameValidationResult {
	valid: boolean;
	error?: string;
}

export const validateUsername = (
	username: string,
): UsernameValidationResult => {
	const result = usernameSchema.safeParse(username);

	if (!result.success) {
		return { error: result.error.issues[0].message, valid: false };
	}

	return { valid: true };
};
