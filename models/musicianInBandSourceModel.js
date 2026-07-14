async function attach(client, relationKey, proposal) {
  return (await client.query(`INSERT INTO public.musician_in_band_source
    (musician_in_band_key,source_type,source_entity_id,source_relationship_id,source_url,source_role,source_date_from,source_date_to,raw_payload)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
    ON CONFLICT (musician_in_band_key, lower(source_type), source_entity_id)
    DO UPDATE SET source_relationship_id=EXCLUDED.source_relationship_id, source_url=EXCLUDED.source_url,
      source_role=EXCLUDED.source_role, source_date_from=EXCLUDED.source_date_from, source_date_to=EXCLUDED.source_date_to,
      raw_payload=EXCLUDED.raw_payload, retrieved_at=now()
    RETURNING *`, [relationKey, proposal.source_type, proposal.source_person_external_id, proposal.source_relationship_id,
      proposal.source_url, proposal.proposed_role, proposal.proposed_date_from, proposal.proposed_date_to, JSON.stringify(proposal.raw_payload || {})])).rows[0];
}
module.exports = { attach };
