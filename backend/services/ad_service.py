from sqlalchemy.orm import Session
from ..models import Setting, ADGroup
import json

class ADService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = self._load_settings()

    def _load_settings(self):
        settings_list = self.db.query(Setting).all()
        return {s.key: s.value for s in settings_list}

    def is_mock(self):
        return self.settings.get("mock_mode", "true").lower() == "true"

    def _get_connection(self):
        try:
            from ldap3 import Server, Connection, NTLM, SUBTREE, ALL
            
            server_host = self.settings.get("ad_server")
            domain = self.settings.get("ad_domain", "corp.local")
            user = self.settings.get("ad_user")
            password = self.settings.get("ad_password")
            
            # Construct full username (DOMAIN\User)
            full_user = f"{domain}\\{user}" if "\\" not in user else user
            
            server = Server(server_host, get_info=ALL)
            conn = Connection(server, user=full_user, password=password, authentication=NTLM, auto_bind=True)
            return conn
        except Exception as e:
            print(f"[AD ERROR] Connection failed: {e}")
            raise e

    def create_group(self, name: str, description: str = ""):
        if self.is_mock():
            print(f"[MOCK AD] Creating Log Group: {name}")
            return True
        else:
            try:
                # Real implementation
                conn = self._get_connection()
                domain_parts = self.settings.get("ad_domain", "corp.local").split('.')
                dc_string = ",".join([f"DC={part}" for part in domain_parts])
                
                # Where to create groups? (Just default Users or a specific OU if configured)
                # For now, put in Users container
                dn = f"CN={name},CN=Users,{dc_string}"
                
                attributes = {
                    'sAMAccountName': name,
                    'description': description or "Created by PermitFlow"
                }
                
                success = conn.add(dn, 'group', attributes)
                if success:
                    print(f"[REAL AD] Created group: {name}")
                    conn.unbind()
                    return True
                else:
                    print(f"[REAL AD] Failed: {conn.result}")
                    conn.unbind()
                    return False
            except Exception as e:
                print(f"[REAL AD] Exception: {e}")
                return False

    def add_member(self, group_name: str, username: str):
        if self.is_mock():
            print(f"[MOCK AD] Adding {username} to {group_name}")
            return True
        else:
            try:
                conn = self._get_connection()
                domain_parts = self.settings.get("ad_domain", "corp.local").split('.')
                dc_string = ",".join([f"DC={part}" for part in domain_parts])
                
                # Find Group DN
                conn.search(dc_string, f"(&(objectClass=group)(sAMAccountName={group_name}))")
                if not conn.entries:
                    print(f"[REAL AD] Group not found: {group_name}")
                    return False
                group_dn = conn.entries[0].entry_dn
                
                # Find User DN
                conn.search(dc_string, f"(&(objectClass=user)(sAMAccountName={username}))")
                if not conn.entries:
                     print(f"[REAL AD] User not found: {username}")
                     return False
                user_dn = conn.entries[0].entry_dn
                
                # Add Member
                from ldap3 import MODIFY_ADD
                success = conn.modify(group_dn, {'member': [(MODIFY_ADD, [user_dn])]})
                conn.unbind()
                return success
            except Exception as e:
                 print(f"[REAL AD] Exception: {e}")
                 return False
    def check_user_exists(self, username: str):
        if self.is_mock():
            # Mock behavior: Assume user exists if not "invalid"
            return username.lower() != "invalid"
        else:
            try:
                conn = self._get_connection()
                domain_parts = self.settings.get("ad_domain", "corp.local").split('.')
                dc_string = ",".join([f"DC={part}" for part in domain_parts])
                
                query = f"(&(objectClass=user)(sAMAccountName={username}))"
                conn.search(dc_string, query, attributes=['cn', 'displayName', 'mail'])
                
                if conn.entries:
                    user_entry = conn.entries[0]
                    conn.unbind()
                    return {
                        "exists": True,
                        "cn": str(user_entry.cn),
                        "displayName": str(user_entry.displayName) if user_entry.displayName else "",
                        "mail": str(user_entry.mail) if user_entry.mail else ""
                    }
                else:
                    conn.unbind()
                    return {"exists": False}
            except Exception as e:
                print(f"[REAL AD] Check User Exception: {e}")
                return {"exists": False, "error": str(e)}
