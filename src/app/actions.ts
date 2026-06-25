"use server";

import { revalidatePath } from "next/cache";
import {
  createDiscipline,
  createNomination,
  createUser,
  getOrCreatePlaceholderUser,
  registerExistingUser,
} from "@/lib/store";
import type { User } from "@/lib/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function signUpNewUserAction(
  name: string
): Promise<ActionResult<User>> {
  try {
    const user = await createUser(name);
    revalidatePath("/");
    return { ok: true, data: user };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function signUpExistingUserAction(
  userId: string
): Promise<ActionResult<User>> {
  try {
    const user = await registerExistingUser(userId);
    revalidatePath("/");
    return { ok: true, data: user };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addDisciplineAction(
  name: string
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const discipline = await createDiscipline(name);
    revalidatePath("/");
    return { ok: true, data: discipline };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function nominateAction(input: {
  disciplineId: string;
  nominatorId: string;
  /** Either an existing user id... */
  nomineeId?: string;
  /** ...or the name of a not-yet-registered person to nominate. */
  nomineeName?: string;
}): Promise<ActionResult> {
  try {
    const { disciplineId, nominatorId, nomineeId, nomineeName } = input;

    let resolvedNomineeId = nomineeId;
    if (!resolvedNomineeId) {
      if (!nomineeName?.trim()) {
        return { ok: false, error: "Choose or name a nominee." };
      }
      const placeholder = await getOrCreatePlaceholderUser(nomineeName);
      resolvedNomineeId = placeholder.id;
    }

    await createNomination({
      disciplineId,
      nominatorId,
      nomineeId: resolvedNomineeId,
    });
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
