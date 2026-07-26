/**
 * User roles within the MediClaim platform.
 *
 * PATIENT — can submit and view their own claims.
 * INSURER — can view all claims and make approval decisions.
 */
export enum Role {
  PATIENT = 'PATIENT',
  INSURER = 'INSURER',
}
