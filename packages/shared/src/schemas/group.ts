import { z } from "zod";

export const GroupRoleSchema = z.enum(["OWNER", "MEMBER"]);

export const GroupMemberSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  displayName: z.string().min(1).max(40),
  profileImageUrl: z.string().url().nullable().optional(),
  role: GroupRoleSchema,
  isActive: z.boolean(),
});

export const GroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(60),
  imageUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#FEE500"),
  members: z.array(GroupMemberSchema),
});

export const CreateGroupBodySchema = z.object({
  name: z.string().trim().min(1).max(60),
  imageUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#FEE500"),
  ownerDisplayName: z.string().trim().min(1).max(40).default("나"),
});

export const UpdateGroupBodySchema = z.object({
  name: z.string().trim().min(1).max(60),
  imageUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const AddTemporaryMemberBodySchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  profileImageUrl: z.string().url().nullable().optional(),
});

export const TransferOwnerBodySchema = z.object({
  memberId: z.string().uuid().or(z.string().min(1)),
});

export const ApproveJoinRequestBodySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("LINK_EXISTING"),
    memberId: z.string().uuid().or(z.string().min(1)),
  }),
  z.object({
    mode: z.literal("CREATE_MEMBER"),
    displayName: z.string().trim().min(1).max(40),
  }),
]);

export type GroupRole = z.infer<typeof GroupRoleSchema>;
export type GroupMember = z.infer<typeof GroupMemberSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type CreateGroupBody = z.infer<typeof CreateGroupBodySchema>;
export type CreateGroupBodyInput = z.input<typeof CreateGroupBodySchema>;
export type UpdateGroupBody = z.infer<typeof UpdateGroupBodySchema>;
export type AddTemporaryMemberBody = z.infer<
  typeof AddTemporaryMemberBodySchema
>;
export type TransferOwnerBody = z.infer<typeof TransferOwnerBodySchema>;
export type ApproveJoinRequestBody = z.infer<
  typeof ApproveJoinRequestBodySchema
>;
