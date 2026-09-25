const {setGlobalOptions} = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {beforeUserCreated} = require("firebase-functions/v2/identity");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Set default max instances and region to asia-south2 (Delhi, India)
setGlobalOptions({maxInstances: 10, region: "asia-south2"});

/**
 * Standard Role Permissions Matrix
 */
const ROLE_PERMISSIONS_MAP = {
  admin: {
    canManagePortal: true,
    canAddMembers: true,
    canRemoveMembers: true,
    canManageRoles: true,
    canManageBilling: true,
    canExportData: true,
    canDeleteLeads: true,
    canAssignLeads: true,
    canViewFinancialReports: true,
  },
  manager: {
    canManagePortal: false,
    canAddMembers: true,
    canRemoveMembers: false,
    canManageRoles: false,
    canManageBilling: false,
    canExportData: true,
    canDeleteLeads: true,
    canAssignLeads: true,
    canViewFinancialReports: true,
  },
  member: {
    canManagePortal: false,
    canAddMembers: false,
    canRemoveMembers: false,
    canManageRoles: false,
    canManageBilling: false,
    canExportData: false,
    canDeleteLeads: false,
    canAssignLeads: false,
    canViewFinancialReports: false,
  },
  viewer: {
    canManagePortal: false,
    canAddMembers: false,
    canRemoveMembers: false,
    canManageRoles: false,
    canManageBilling: false,
    canExportData: false,
    canDeleteLeads: false,
    canAssignLeads: false,
    canViewFinancialReports: false,
  },
};

/**
 * Helper to validate email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * TRIGGER: beforeUserCreated
 * Automatically fires when any new user is registered via Firebase Auth
 * Validates the user, checks for existing co-worker invitations, assigns role & custom claims
 */
exports.onUserCreated = beforeUserCreated({region: "asia-south2"}, async (event) => {
  const user = event.data;
  const email = (user.email || "").toLowerCase().trim();

  logger.info(`Validating new user creation: ${email} (UID: ${user.uid})`);

  if (!email || !isValidEmail(email)) {
    throw new HttpsError(
      "invalid-argument",
      "A valid email address is required to register an account."
    );
  }

  try {
    // Check if this email was invited by an Admin as a co-worker
    const inviteSnapshot = await db
      .collection("invitations")
      .where("email", "==", email)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    let assignedRole = "admin";
    let workspaceId = user.uid;
    let title = "Founder & Workspace Admin";
    let department = "Management";
    let invitedBy = null;

    if (!inviteSnapshot.empty) {
      const inviteData = inviteSnapshot.docs[0].data();
      assignedRole = inviteData.role || "member";
      workspaceId = inviteData.workspaceId || user.uid;
      title = inviteData.title || "Team Member";
      department = inviteData.department || "Operations";
      invitedBy = inviteData.invitedBy || "Admin";

      // Mark invitation as accepted
      await inviteSnapshot.docs[0].ref.update({
        status: "accepted",
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: user.uid,
      });

      logger.info(`Assigned invited co-worker role "${assignedRole}" to ${email}`);
    } else {
      logger.info(`Assigned primary owner role "admin" to new workspace creator ${email}`);
    }

    // Provision the user document in Firestore 'users' collection
    const userDocRef = db.collection("users").doc(user.uid);
    const permissions = ROLE_PERMISSIONS_MAP[assignedRole] || ROLE_PERMISSIONS_MAP.admin;
    const fullName = user.displayName || email.split("@")[0];

    await userDocRef.set(
      {
        uid: user.uid,
        email: email,
        fullName: fullName,
        displayName: fullName.split(" ")[0],
        role: assignedRole,
        status: "active",
        workspaceId: workspaceId,
        title: title,
        department: department,
        invitedBy: invitedBy,
        permissions: permissions,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {merge: true}
    );

    // Return custom claims to attach directly to Auth token
    return {
      customClaims: {
        role: assignedRole,
        admin: assignedRole === "admin",
        workspaceId: workspaceId,
      },
    };
  } catch (error) {
    logger.error("Error in onUserCreated trigger:", error);
    // Return standard claims fallback so user creation is not halted
    return {
      customClaims: {
        role: "admin",
        admin: true,
      },
    };
  }
});

/**
 * CALLABLE: completeUserSignup
 * Called by frontend when Admin finishes workspace onboarding.
 * Validates all fields, updates user role/permissions in Firestore, and sets up the workspace.
 */
exports.completeUserSignup = onCall({region: "asia-south2"}, async (request) => {
  // 1. Verify Authentication
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to complete workspace registration."
    );
  }

  const uid = request.auth.uid;
  const data = request.data || {};

  logger.info(`Executing completeUserSignup for UID: ${uid}`, {data});

  // 2. Validate Inputs
  const fullName = (data.fullName || data.accountOwnerName || "").trim();
  const email = (data.email || request.auth.token.email || "").trim().toLowerCase();
  const workspaceName = (data.workspaceName || "").trim();
  const companyName = (data.companyName || "").trim();
  const role = (data.role || "admin").toLowerCase();
  const useCase = data.useCase || "Freelancing";
  const plan = data.plan || "Pro";
  const teamSize = data.teamSize || "1-5";

  if (!fullName || fullName.length < 2) {
    throw new HttpsError(
      "invalid-argument",
      "Full name must be at least 2 characters long."
    );
  }

  if (!email || !isValidEmail(email)) {
    throw new HttpsError(
      "invalid-argument",
      "A valid email address is required."
    );
  }

  if (!workspaceName || workspaceName.length < 2) {
    throw new HttpsError(
      "invalid-argument",
      "Workspace name must be at least 2 characters long."
    );
  }

  const validRole = ["admin", "manager", "member", "viewer"].includes(role) ? role : "admin";
  const permissions = ROLE_PERMISSIONS_MAP[validRole] || ROLE_PERMISSIONS_MAP.admin;

  try {
    // 3. Set Firebase Auth Custom Claims
    await admin.auth().setCustomUserClaims(uid, {
      role: validRole,
      admin: validRole === "admin",
      workspaceId: uid,
    });

    const now = admin.firestore.FieldValue.serverTimestamp();

    // 4. Update/Create User in 'users' collection
    const userPayload = {
      uid,
      email,
      fullName,
      displayName: fullName.split(" ")[0],
      role: validRole,
      status: "active",
      workspaceId: uid,
      companyName: companyName || workspaceName,
      title: data.title || (validRole === "admin" ? "Founder & Workspace Admin" : "Team Member"),
      department: data.department || "Management",
      permissions: permissions,
      updatedAt: now,
      lastActiveAt: now,
    };

    const userDocRef = db.collection("users").doc(uid);
    await userDocRef.set(
      {
        ...userPayload,
        createdAt: now,
      },
      {merge: true}
    );

    // 5. Setup Workspace in 'workspaces' collection
    const workspaceDocRef = db.collection("workspaces").doc(uid);
    const workspacePayload = {
      workspaceId: uid,
      ownerId: uid,
      workspaceName: workspaceName,
      companyName: companyName || workspaceName,
      accountOwnerName: fullName,
      email: email,
      role: validRole,
      teamSize: teamSize,
      plan: plan,
      planId: data.planId || "pro",
      trialActive: data.trialActive !== false,
      trialStartDate: data.trialStartDate || new Date().toISOString().slice(0, 10),
      trialEndDate:
        data.trialEndDate ||
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      useCase: useCase,
      pipelineStages: data.pipelineStages || [
        "Inbound Lead",
        "In Discovery",
        "Proposal Sent",
        "Negotiation",
        "Won",
        "Lost",
      ],
      companyLogoUrl: data.companyLogoUrl || "",
      capabilities: data.capabilities || {},
      updatedAt: now,
    };

    await workspaceDocRef.set(
      {
        ...workspacePayload,
        createdAt: now,
      },
      {merge: true}
    );

    logger.info(`Successfully completed signup for UID ${uid} in workspace ${workspaceName}`);

    return {
      success: true,
      message: "Workspace and user account successfully configured.",
      user: {
        uid,
        email,
        fullName,
        role: validRole,
        workspaceId: uid,
      },
      workspace: {
        workspaceId: uid,
        workspaceName,
        plan,
      },
    };
  } catch (error) {
    logger.error("Error executing completeUserSignup:", error);
    throw new HttpsError("internal", error.message || "Failed to finalize user account.");
  }
});

/**
 * CALLABLE: inviteCoworker
 * Called by an Admin to invite a co-worker to their workspace portal
 */
exports.inviteCoworker = onCall({region: "asia-south2"}, async (request) => {
  // 1. Verify Authentication
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to invite co-workers."
    );
  }

  const callerUid = request.auth.uid;
  const data = request.data || {};

  // 2. Verify Caller Role & Permission
  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.exists) {
    throw new HttpsError("permission-denied", "Caller profile not found.");
  }

  const callerData = callerDoc.data();
  if (callerData.role !== "admin" && !callerData.permissions?.canAddMembers) {
    throw new HttpsError(
      "permission-denied",
      "Only workspace Admins or Managers can invite co-workers."
    );
  }

  const workspaceId = callerData.workspaceId || callerUid;

  // 3. Validate Co-worker Info
  const email = (data.email || "").trim().toLowerCase();
  const fullName = (data.fullName || "").trim();
  const role = (data.role || "member").toLowerCase();
  const title = (data.title || "Team Member").trim();
  const department = data.department || "Operations";

  if (!email || !isValidEmail(email)) {
    throw new HttpsError("invalid-argument", "Valid co-worker email is required.");
  }

  if (!fullName || fullName.length < 2) {
    throw new HttpsError("invalid-argument", "Co-worker full name is required.");
  }

  if (!["admin", "manager", "member", "viewer"].includes(role)) {
    throw new HttpsError("invalid-argument", "Invalid role selected.");
  }

  try {
    const inviteId = `invite-${Date.now()}`;
    const now = admin.firestore.FieldValue.serverTimestamp();

    // 4. Save Invitation
    await db.collection("invitations").doc(inviteId).set({
      id: inviteId,
      email: email,
      fullName: fullName,
      role: role,
      title: title,
      department: department,
      workspaceId: workspaceId,
      invitedBy: callerData.fullName || "Admin",
      invitedByUid: callerUid,
      status: "pending",
      createdAt: now,
    });

    // 5. Create Pre-registered Member record in 'users' collection with status 'invited'
    const memberDocRef = db.collection("users").doc(inviteId);
    const memberRecord = {
      id: inviteId,
      uid: inviteId,
      email: email,
      fullName: fullName,
      displayName: fullName.split(" ")[0],
      role: role,
      status: "invited",
      workspaceId: workspaceId,
      title: title,
      department: department,
      invitedBy: callerData.fullName || "Admin",
      permissions: ROLE_PERMISSIONS_MAP[role] || ROLE_PERMISSIONS_MAP.member,
      createdAt: now,
      lastActiveAt: "Invitation Sent",
    };

    await memberDocRef.set(memberRecord, {merge: true});

    logger.info(`Invited co-worker ${email} with role ${role} to workspace ${workspaceId}`);

    return {
      success: true,
      message: `Invitation successfully sent to ${email}`,
      member: memberRecord,
    };
  } catch (error) {
    logger.error("Error in inviteCoworker:", error);
    throw new HttpsError("internal", error.message || "Failed to invite co-worker.");
  }
});
