# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Emcee::TeamHostStats" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:emcee) { create(:user, :emcee) }
  let(:other_emcee) { create(:user, :emcee) }
  let(:host1) { create(:user, :host) }
  let(:host2) { create(:user, :host) }
  let(:team) { create(:team) }
  let(:other_team) { create(:team) }
  let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

  before do
    # Emcee is assigned to the team via TeamEmceeAssignment (not TeamMembership)
    create(:team_emcee_assignment, user: emcee, team: team)
    create(:team_membership, user: host1, team: team)
    create(:team_membership, user: host2, team: team)
  end

  describe "#index" do
    path "/api/v1/emcee/team_host_stats" do
      get "returns host performance stats for a team" do
        tags "Emcee::TeamHostStats"
        produces "application/json"
        parameter name: :team_id, in: :query, type: :integer, required: true
        parameter name: :date_from, in: :query, type: :string, required: false
        parameter name: :date_to, in: :query, type: :string, required: false

        response(200, "returns hosts ranked by total coins with quota progress") do
          let(:team_id) { team.id }

          before do
            create(:coin_entry, session: session, user: host1, coins: 60_000)
            create(:coin_entry, session: session, user: host2, coins: 20_000)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data.length).to eq(2)
            expect(data.first[:user_id]).to eq(host1.id)
            expect(data.first[:name]).to eq(host1.name)
            expect(data.first[:total_coins]).to eq(60_000)
            expect(data.first[:monthly_coin_quota]).to eq(300_000)
            expect(data.first[:quota_progress]).to eq(20.0)
            expect(data.first[:sessions_attended]).to eq(1)
            expect(data.second[:quota_progress]).to eq(6.7)
            expect(data.first).to have_key(:paced_monthly_coins)
            expect(data.first).to have_key(:on_track)
            expect(data.first).to have_key(:at_risk)
          end
        end

        response(200, "filters by date range") do
          let(:team_id) { team.id }
          let(:date_from) { Date.current.to_s }
          let(:date_to) { Date.current.to_s }
          let(:old_session) { create(:session, team: team, created_by: emcee, date: 2.months.ago.to_date, session_slot: :slot_two) }

          before do
            create(:coin_entry, session: session, user: host1, coins: 10_000)
            create(:coin_entry, session: old_session, user: host1, coins: 5_000)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            h1 = json_response[:data].find { |h| h[:user_id] == host1.id }
            expect(h1[:total_coins]).to eq(10_000)
            expect(h1[:sessions_attended]).to eq(1)
          end
        end

        response(200, "returns zero stats for hosts with no entries") do
          let(:team_id) { team.id }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data.length).to eq(2)
            data.each do |h|
              expect(h[:total_coins]).to eq(0)
              expect(h[:quota_progress]).to eq(0.0)
              expect(h[:sessions_attended]).to eq(0)
            end
          end
        end

        response(403, "returns forbidden for a team not assigned to the emcee") do
          let(:team_id) { other_team.id }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(403, "returns forbidden for host role") do
          let(:team_id) { team.id }

          before { sign_in host1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
