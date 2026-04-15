import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../firebase/config";

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[];
  createdAt: number;
}

// Create a new group
export const createGroup = async (
  name: string,
  description: string,
  creatorId: string,
  memberIds: string[] = []
) => {
  if (!name.trim()) {
    throw new Error("Group name cannot be empty");
  }

  if (name.length > 50) {
    throw new Error("Group name cannot exceed 50 characters");
  }

  if (description.length > 200) {
    throw new Error("Group description cannot exceed 200 characters");
  }

  const docRef = await addDoc(collection(db, "groups"), {
    name: name.trim(),
    description: description.trim(),
    createdBy: creatorId,
    members: [creatorId, ...memberIds],
    createdAt: Date.now(),
  });

  return { id: docRef.id, name, description, createdBy: creatorId, members: [creatorId, ...memberIds], createdAt: Date.now() };
};

// Get user's groups
export const getUserGroups = async (userId: string): Promise<Group[]> => {
  const q = query(collection(db, "groups"), where("members", "array-contains", userId));
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Group, "id">),
  })) as Group[];
};

// Add member to group
export const addGroupMember = async (groupId: string, memberId: string) => {
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, {
    members: arrayUnion(memberId),
  });
};

// Get all users in a group
export const getGroupMembers = async (groupId: string) => {
  const groupRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupRef);

  if (groupSnap.exists()) {
    return (groupSnap.data() as Group).members;
  }
  return [];
};
