import test_foundation
import db

def test_firestore():
    if getattr(db, 'db', None) is None:
        print("Firestore DB is None. Cannot test.")
        return
        
    print("Writing test doc to Firestore...", end="")
    try:
        doc_ref = db.db.collection("test_collection").document("test_doc")
        doc_ref.set({"message": "Hello Firestore"})
        print(" OK")
        
        print("Reading test doc...", end="")
        doc = doc_ref.get()
        if doc.exists:
            print(" OK", doc.to_dict())
        else:
            print(" FAILED")
            
        print("Deleting test doc...", end="")
        doc_ref.delete()
        print(" OK")
    except Exception as e:
        print(" FAILED", e)

if __name__ == "__main__":
    test_firestore()
