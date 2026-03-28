# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Emcee::TeamSessions" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:emcee) { create(:user, :emcee) }
  let(:other_emcee) { create(:user, :emcee) }
  let(:host1) { create(:user, :host) }
  let(:host2) { create(:user, :host) }
  let(:team) { create(:team) }
  let(:other_team) { create(:team) }
  let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }
  let(:other_session) { create(:session, team: other_team, created_by: other_emcee, date: Date.current, session_slot: :slot_two) }

  before do
    create(:team_membership, user: emcee, team: team)
    create(:team_membership, user: host1, team: team)
    session.session_hosts.create!(user: host1)
    session.session_hosts.create!(user: host2)
  end

  describe "#index" do
    path "/api/v1/emcee/team_sessions" do
      get "returns session performance for the emcee's teams" do
        tags "Emcee::TeamSessions"
        produces "application/json"
        parameter name: :date_from, in: :query, type: :string, required: false
        parameter name: :date_to, in: :query, type: :string, required: false

        response(200, "returns sessions with totals and host breakdown") do
          before do
            create(:coin_entry, session: session, user: host1, coins: 20_000)
            create(:coin_entry, session: session, user: host2, coins: 10_000)
            create(:coin_entry, session: other_session, user: host1, coins: 50_000)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            s = json_response[:data].first
            expect(s[:total_coins]).to eq(30_000)
            expect(s[:top_earner_email]).to eq(host1.email)
            expect(s[:top_earner_coins]).to eq(20_000)
            expect(s[:host_breakdown].length).to eq(2)
          end
        end

        response(200, "flags cross-team guest hosts") do
          before do
            create(:coin_entry, session: session, user: host1, coins: 15_000)
            create(:coin_entry, session: session, user: host2, coins: 8_000)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            breakdown = json_response[:data].first[:host_breakdown]
            h1 = breakdown.find { |h| h[:email] == host1.email }
            h2 = breakdown.find { |h| h[:email] == host2.email }
            expect(h1[:is_guest]).to be false
            expect(h2[:is_guest]).to be true
          end
        end

        response(200, "filters by date range") do
          let(:date_from) { Date.current.to_s }
          let(:date_to) { Date.current.to_s }
          let(:old_session) { create(:session, team: team, created_by: emcee, date: 2.months.ago.to_date, session_slot: :slot_two) }

          before do
            create(:coin_entry, session: session, user: host1, coins: 5_000)
            create(:coin_entry, session: old_session, user: host1, coins: 3_000)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
          end
        end

        response(200, "returns empty array for emcee with no team sessions") do
          let(:emcee_no_team) { create(:user, :emcee) }

          before { sign_in emcee_no_team }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data]).to be_empty
          end
        end

        response(403, "returns forbidden for host") do
          before { sign_in host1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
