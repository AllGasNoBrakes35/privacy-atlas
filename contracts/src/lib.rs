use tari_template_lib::prelude::*;

fn validate_digest(digest: &str) {
    assert!(digest.len() == 64 && digest.bytes().all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c)), "Expected lowercase SHA-256 hex");
}

#[template]
mod privacy_atlas_snapshot {
    use super::*;

    /// An immutable public commitment to one published research edition.
    /// A commitment proves integrity, not the accuracy of its source material.
    pub struct PrivacyAtlasSnapshot {
        sha256: String,
        research_url: String,
    }

    impl PrivacyAtlasSnapshot {
        pub fn new(sha256: String, research_url: String) -> Component<Self> {
            validate_digest(&sha256);
            assert!(research_url.starts_with("https://") && research_url.len() <= 512, "Expected an HTTPS research URL up to 512 bytes");
            Component::new(Self { sha256, research_url })
                .with_owner_rule(OwnerRule::None)
                .with_access_rules(ComponentAccessRules::new()
                    .method("digest", rule!(allow_all))
                    .method("research_url", rule!(allow_all)))
                .create()
        }

        pub fn digest(&self) -> String { self.sha256.clone() }
        pub fn research_url(&self) -> String { self.research_url.clone() }
    }
}

#[cfg(test)]
mod tests {
    use super::validate_digest;

    #[test]
    fn accepts_sha256() { validate_digest(&"a0".repeat(32)); }

    #[test]
    #[should_panic(expected = "Expected lowercase SHA-256 hex")]
    fn rejects_non_hex() { validate_digest(&"zz".repeat(32)); }

    #[test]
    #[should_panic(expected = "Expected lowercase SHA-256 hex")]
    fn rejects_truncated_digest() { validate_digest("abc123"); }
}
