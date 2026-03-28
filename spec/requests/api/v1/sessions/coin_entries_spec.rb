# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Sessions::CoinEntries" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host1) { create(:user, :host) }
  let(:host2) { create(:user, :host) }
  let(:team) { create(:team) }
  let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

  before do
    create(:team_membership, user: emcee, team: team)
    session.session_hosts.create!(user: host1)
    session.session_hosts.create!(user: host2)
  end

  describe "#index" do
    path "/api/v1/sessions/{session_id}/coin_entries" do
      parameter name: :session_id, in: :path, type: :integer

      get "lists coin entries for a session" do
        tags "CoinEntries"
        produces "application/json"

        response(200, "returns entries for admin") do
          let(:session_id) { session.id }

          before do
            create(:coin_entry, session: session, user: host1, coins: 10_000)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:coins]).to eq(10_000)
          end
        end

        response(200, "returns entries for emcee on their team") do
          let(:session_id) { session.id }

          before do
            create(:coin_entry, session: session, user: host1, coins: 5_000)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
          end
        end

        response(403, "returns forbidden for emcee on other team's session") do
          let(:other_emcee) { create(:user, :emcee) }
          let(:session_id) { session.id }

          before { sign_in other_emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(403, "returns forbidden for host") do
          let(:session_id) { session.id }

          before { sign_in host1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(404, "returns not found for missing session") do
          let(:session_id) { 0 }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end
      end
    end
  end

  describe "#create" do
    path "/api/v1/sessions/{session_id}/coin_entries" do
      parameter name: :session_id, in: :path, type: :integer

      post "bulk-saves coin entries for a session" do
        tags "CoinEntries"
        consumes "application/json"
        produces "application/json"
        parameter name: :params, in: :body, schema: {
          type: :object,
          properties: {
            entries: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  user_id: { type: :integer },
                  coins: { type: :integer }
                },
                required: [ "user_id", "coins" ]
              }
            }
          },
          required: [ "entries" ]
        }

        response(201, "saves entries for emcee") do
          let(:session_id) { session.id }
          let(:params) { { entries: [ { user_id: host1.id, coins: 15_000 }, { user_id: host2.id, coins: 0 } ] } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :created
            expect(json_response[:data].length).to eq(2)
            expect(json_response[:data].map { |e| e[:coins] }).to contain_exactly(15_000, 0)
          end
        end

        response(201, "saves entries for admin") do
          let(:session_id) { session.id }
          let(:params) { { entries: [ { user_id: host1.id, coins: 25_000 } ] } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :created
          end
        end

        response(201, "overwrites existing entry on re-submit") do
          let(:session_id) { session.id }
          let(:params) { { entries: [ { user_id: host1.id, coins: 9_999 } ] } }

          before do
            create(:coin_entry, session: session, user: host1, coins: 1_000)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :created
            expect(json_response[:data].first[:coins]).to eq(9_999)
          end
        end

        response(422, "rejects entry for non-participating host") do
          let(:outsider) { create(:user, :host) }
          let(:session_id) { session.id }
          let(:params) { { entries: [ { user_id: outsider.id, coins: 5_000 } ] } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :unprocessable_entity
          end
        end

        response(403, "returns forbidden for emcee on other team's session") do
          let(:other_emcee) { create(:user, :emcee) }
          let(:session_id) { session.id }
          let(:params) { { entries: [ { user_id: host1.id, coins: 5_000 } ] } }

          before { sign_in other_emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(403, "returns forbidden for host") do
          let(:session_id) { session.id }
          let(:params) { { entries: [] } }

          before { sign_in host1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end

  describe "#update" do
    let(:entry) { create(:coin_entry, session: session, user: host1, coins: 5_000) }

    path "/api/v1/sessions/{session_id}/coin_entries/{id}" do
      parameter name: :session_id, in: :path, type: :integer
      parameter name: :id, in: :path, type: :integer

      patch "updates a coin entry" do
        tags "CoinEntries"
        consumes "application/json"
        produces "application/json"
        parameter name: :params, in: :body, schema: {
          type: :object,
          properties: {
            coin_entry: {
              type: :object,
              properties: { coins: { type: :integer } },
              required: [ "coins" ]
            }
          },
          required: [ "coin_entry" ]
        }

        response(200, "admin can edit entry from any month") do
          let(:session_id) { session.id }
          let(:id) { entry.id }
          let(:params) { { coin_entry: { coins: 8_000 } } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:coins]).to eq(8_000)
            expect(entry.coin_entry_audits.count).to eq(1)
            expect(entry.coin_entry_audits.last.previous_coins).to eq(5_000)
          end
        end

        response(200, "emcee can edit entry from current month") do
          let(:session_id) { session.id }
          let(:id) { entry.id }
          let(:params) { { coin_entry: { coins: 3_000 } } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:coins]).to eq(3_000)
          end
        end

        response(403, "emcee cannot edit entry from previous month") do
          let(:old_session) { create(:session, team: team, created_by: emcee, date: 2.months.ago.to_date) }
          let(:old_entry) { create(:coin_entry, session: old_session, user: host1, coins: 1_000) }
          let(:session_id) { old_session.id }
          let(:id) { old_entry.id }
          let(:params) { { coin_entry: { coins: 2_000 } } }

          before do
            create(:team_membership, user: emcee, team: team) if emcee.teams.where(id: team.id).empty?
            old_session.session_hosts.create!(user: host1)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(404, "returns not found for missing entry") do
          let(:session_id) { session.id }
          let(:id) { 0 }
          let(:params) { { coin_entry: { coins: 1_000 } } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end

        response(403, "returns forbidden for host") do
          let(:session_id) { session.id }
          let(:id) { entry.id }
          let(:params) { { coin_entry: { coins: 1_000 } } }

          before { sign_in host1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
